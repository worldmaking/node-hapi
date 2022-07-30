#include "node-api-helpers.h"

#include "HAPI/HAPI.h"
#include "HAPI/HAPI_Version.h"
#include <iostream>
#include <string>
#include <vector>

#define ENSURE_SUCCESS( result ) \
if ( (result) != HAPI_RESULT_SUCCESS ) \
{ \
    std::cerr << "Node-HAPI Failure at " << __FILE__ << ": " << __LINE__ << std::endl; \
    std::cerr << getLastError() << std::endl; \
    exit( 1 ); \
}

#define ENSURE_COOK_SUCCESS( result ) \
if ( (result) != HAPI_RESULT_SUCCESS ) \
{ \
    std::cerr << "Node-HAPI Failure at " << __FILE__ << ": " << __LINE__ << std::endl; \
    std::cerr << getLastCookError() << std::endl; \
    exit( 1 ); \
}

static std::string getLastError() {
    int bufferLength;
    HAPI_GetStatusStringBufLength( nullptr, HAPI_STATUS_CALL_RESULT, HAPI_STATUSVERBOSITY_ERRORS, &bufferLength );
    char * buffer = new char[ bufferLength ];
    HAPI_GetStatusString( nullptr, HAPI_STATUS_CALL_RESULT, buffer, bufferLength );
    std::string result( buffer );
    delete [] buffer;
    return result;
}

static std::string getLastCookError() {
    int bufferLength;
    HAPI_GetStatusStringBufLength( nullptr, HAPI_STATUS_COOK_RESULT, HAPI_STATUSVERBOSITY_ERRORS, &bufferLength );
    char * buffer = new char[ bufferLength ];
    HAPI_GetStatusString( nullptr, HAPI_STATUS_COOK_RESULT, buffer, bufferLength );
    std::string result( buffer );
    delete[] buffer;
    return result;
}

///////////////////////////////////////////////////////////////////////////////////

// just making it global for now; may make it into a separate object at some point.
HAPI_Session session;
HAPI_CookOptions cookoptions;

napi_value test(napi_env env, napi_callback_info info) {
	napi_status status = napi_ok;
	napi_value result = nullptr;


	// ported from https://www.sidefx.com/docs/hengine/_h_a_p_i__full_source_samples__asset_inputs.html
    HAPI_NodeId newNode;
    ENSURE_SUCCESS( HAPI_CreateInputNode( &session, &newNode, "Triangle" ) );
    ENSURE_SUCCESS( HAPI_CookNode ( &session, newNode, &cookoptions ) );
    int cookStatus;

	// this is a blocking call, while looping until the cook result is success
    HAPI_Result cookResult;
    do {
    	cookResult = HAPI_GetStatus( &session, HAPI_STATUS_COOK_STATE, &cookStatus );
    }
    while (cookStatus > HAPI_STATE_MAX_READY_STATE && cookResult == HAPI_RESULT_SUCCESS);
    ENSURE_SUCCESS( cookResult );
    ENSURE_COOK_SUCCESS( cookStatus );
    
    HAPI_PartInfo newNodePart = HAPI_PartInfo_Create();
    newNodePart.type = HAPI_PARTTYPE_MESH;
    newNodePart.faceCount = 1;
    newNodePart.vertexCount = 3;
    newNodePart.pointCount = 3;
    
    ENSURE_SUCCESS( HAPI_SetPartInfo( &session, newNode, 0, &newNodePart ) );
    HAPI_AttributeInfo newNodePointInfo = HAPI_AttributeInfo_Create();
    newNodePointInfo.count = 3;
    newNodePointInfo.tupleSize = 3;
    newNodePointInfo.exists = true;
    newNodePointInfo.storage = HAPI_STORAGETYPE_FLOAT;
    newNodePointInfo.owner = HAPI_ATTROWNER_POINT;
    ENSURE_SUCCESS( HAPI_AddAttribute( &session, newNode, 0, "P", &newNodePointInfo ) );
    float positions[ 9 ] = { 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 1.0f, 0.0f, 0.0f };
    ENSURE_SUCCESS( HAPI_SetAttributeFloatData( &session, newNode, 0, "P", &newNodePointInfo, positions, 0, 3 ) );
    int vertices[ 3 ] = { 0, 1, 2 };
    ENSURE_SUCCESS( HAPI_SetVertexList( &session, newNode, 0, vertices, 0, 3 ) );
    int face_counts [ 1 ] = { 3 };
    ENSURE_SUCCESS( HAPI_SetFaceCounts( &session, newNode, 0, face_counts, 0, 1 ) );
    char ** strs = new char * [ 3 ];
    strs[ 0 ] = _strdup( "strPoint1 " );
    strs[ 1 ] = _strdup( "strPoint2 " );
    strs[ 2 ] = _strdup( "strPoint3 " );
    newNodePointInfo.count = 3;
    newNodePointInfo.tupleSize = 1;
    newNodePointInfo.exists = true;
    newNodePointInfo.storage = HAPI_STORAGETYPE_STRING;
    newNodePointInfo.owner = HAPI_ATTROWNER_POINT;
    ENSURE_SUCCESS( HAPI_AddAttribute( &session, newNode, 0, "strData", &newNodePointInfo ) );
    ENSURE_SUCCESS( HAPI_SetAttributeStringData( &session, newNode, 0, "strData", &newNodePointInfo, (const char ** ) strs, 0, 3 ) );
    
    ENSURE_SUCCESS( HAPI_CommitGeo( &session, newNode ) );
    
    ENSURE_SUCCESS( HAPI_SaveHIPFile( &session, "geometry.hip", false ) );
    
	return (status == napi_ok) ? result : nullptr;
}

void sessionCleanup(void * session) {
	HAPI_Cleanup((HAPI_Session *)session);
}

napi_value init(napi_env env, napi_value exports) {

	int major=0, minor=0, rev=0;
	HAPI_GetEnvInt(HAPI_ENVINT_VERSION_HOUDINI_MAJOR, &major);
	HAPI_GetEnvInt(HAPI_ENVINT_VERSION_HOUDINI_MINOR, &minor);
	HAPI_GetEnvInt(HAPI_ENVINT_VERSION_HOUDINI_BUILD, &rev);
	printf("Node-HAPI built for Houdini version %d.%d.%d\n", major, minor, rev);	

	bool bUseInProcess = true;
	bool bUseCookingThread = true;
    if(bUseInProcess)
    {
        // Creates an in process session
        HAPI_CreateInProcessSession( &session );
    }
    else
    {
        // Start and connect to an out of process session
        HAPI_ThriftServerOptions serverOptions{ 0 };
        serverOptions.autoClose = true;
        serverOptions.timeoutMs = 3000.0f;
        
        // Start a HARS named-pipe server named "hapi"
        ENSURE_SUCCESS( HAPI_StartThriftNamedPipeServer(&serverOptions, "hapi", nullptr) );
        // and create a new HAPI session to use that server
        ENSURE_SUCCESS( HAPI_CreateThriftNamedPipeSession(&session, "hapi") );
    }

	// // start up Houdini:
	// HAPI_DECL HAPI_Initialize( const HAPI_Session * session,
    //                        const HAPI_cookoptions * cook_options,
    //                        HAPI_Bool use_cooking_thread,
    //                        int cooking_thread_stack_size,
    //                        const char * houdini_environment_files,
    //                        const char * otl_search_path,
    //                        const char * dso_search_path,
    //                        const char * image_dso_search_path,
    //                        const char * audio_dso_search_path );
	cookoptions = HAPI_CookOptions_Create();
	ENSURE_SUCCESS( HAPI_Initialize(&session, &cookoptions, bUseCookingThread, -1, nullptr, nullptr, nullptr, nullptr, nullptr));

	// add handler to clean it up:
	napi_add_env_cleanup_hook(env, sessionCleanup, (void *)&session);

	napi_status status;
	napi_property_descriptor properties[] = {
		{ "test", 0, test, 0, 0, 0, napi_default, 0 },
		
	};
	status = napi_define_properties(env, exports, sizeof(properties)/sizeof(napi_property_descriptor), properties);
	//assert(status == napi_ok);
	return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, init)