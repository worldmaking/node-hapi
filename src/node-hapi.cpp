#include "node-api-helpers.h"

#include "HAPI/HAPI.h"
#include "HAPI/HAPI_API.h"
#include "HAPI/HAPI_Common.h"
#include "HAPI/HAPI_Helpers.h"
#include "HAPI/HAPI_Version.h"

#include "GLTF/GLTF_API.h"
// fatal error C1189: #error:  "You must compile with the /GR switch (RTTI)
// need to work out why all the following fail build
// #include "GLTF/GLTF_Loader.h"
// #include "GLTF/GLTF_Types.h"
// #include "GLTF/GLTF_Util.h"
// #include "GLTF/GLTF_Cache.h"
// #include "GLTF/GLTF_GeoLoader.h"


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

static std::string getLastError();
static std::string getLastCookError();
static std::string getString( HAPI_StringHandle stringHandle );
static void printCompleteNodeInfo( HAPI_Session &session, HAPI_NodeId nodeId,
                   HAPI_AssetInfo &assetInfo);
static void processGeoPart( HAPI_Session &session, HAPI_AssetInfo &assetInfo,
                HAPI_NodeId objectNode, HAPI_NodeId geoNode,
                HAPI_PartId partId );
static void processFloatAttrib( HAPI_Session &session, HAPI_AssetInfo &assetInfo,
                HAPI_NodeId objectNode, HAPI_NodeId geoNode,
                HAPI_PartId partId, HAPI_AttributeOwner owner,
                std::string name );

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

static std::string getString( HAPI_StringHandle stringHandle ) {
    if ( stringHandle == 0 )
    {
        return "";
    }
    int bufferLength;
    HAPI_GetStringBufLength( nullptr,
                   stringHandle,
                   &bufferLength );
    char * buffer = new char[ bufferLength ];
    HAPI_GetString ( nullptr, stringHandle, buffer, bufferLength );
    std::string result( buffer );
    delete [] buffer;
    return result;
}

///////////////////////////////////////////////////////////////////////////////////

static void
printCompleteNodeInfo( HAPI_Session &session, HAPI_NodeId nodeId,
               HAPI_AssetInfo &assetInfo )
{
    HAPI_NodeInfo nodeInfo;
    ENSURE_SUCCESS( HAPI_GetNodeInfo ( &session, nodeId, &nodeInfo ) );
    
    int objectCount = 0;
    HAPI_ObjectInfo * objectInfos = 0;
    if (nodeInfo.type == HAPI_NODETYPE_SOP)
    {
        // For pure SOP asset, a parent object will be created automatically,
        // so use parent's ID to get the object info
        objectCount = 1;
        objectInfos = new HAPI_ObjectInfo[objectCount];
        ENSURE_SUCCESS( HAPI_GetObjectInfo ( &session, nodeInfo.parentId, &objectInfos[0] ) );
    }
    else if (nodeInfo.type == HAPI_NODETYPE_OBJ)
    {
        // This could have children objects or not.
        // If has children, get child object infos.
        // If no children, presume this node is the only object.
        ENSURE_SUCCESS( HAPI_ComposeObjectList(&session, nodeId,
            nullptr, &objectCount ) );
    if (objectCount > 0)
    {
        objectInfos = new HAPI_ObjectInfo[objectCount];
        ENSURE_SUCCESS( HAPI_GetComposedObjectList( &session, nodeInfo.parentId,
            objectInfos, 0, objectCount ) );
    }
    else
    {
        objectCount = 1;
        objectInfos = new HAPI_ObjectInfo[objectCount];
        ENSURE_SUCCESS( HAPI_GetObjectInfo ( &session, nodeId, &objectInfos[0] ) );
    }
    }
    else
    {
        std::cout << "Unsupported node type: " << HAPI_NODETYPE_OBJ << std::endl;
        return;
    }
    for (int objectIndex = 0; objectIndex < objectCount; ++objectIndex)
    {
        HAPI_ObjectInfo &objectInfo = objectInfos[objectIndex];
        HAPI_GeoInfo geoInfo;
        ENSURE_SUCCESS( HAPI_GetDisplayGeoInfo ( &session, objectInfo.nodeId, &geoInfo ) );
        for (int partIndex = 0; partIndex < geoInfo.partCount; ++partIndex)
        {
            processGeoPart( session, assetInfo, objectInfo.nodeId,
            geoInfo.nodeId, partIndex );
        }
    }
    
    delete[] objectInfos;
}
static void
processFloatAttrib( HAPI_Session &session, HAPI_AssetInfo &assetInfo,
            HAPI_NodeId objectNode, HAPI_NodeId geoNode,
            HAPI_PartId partId, HAPI_AttributeOwner owner,
            std::string name )
{
    HAPI_AttributeInfo attribInfo;
    ENSURE_SUCCESS( HAPI_GetAttributeInfo( &session, geoNode, partId,
                       name.c_str(), owner, &attribInfo ) );
    
    float * attribData = new float[ attribInfo.count * attribInfo.tupleSize ];
    ENSURE_SUCCESS( HAPI_GetAttributeFloatData( &session, geoNode, partId,
                        name.c_str(), &attribInfo, -1,
                        attribData, 0, attribInfo.count ) );
    for ( int elemIndex = 0; elemIndex < attribInfo.count; ++elemIndex )
    {
        for ( int tupleIndex = 0; tupleIndex < attribInfo.tupleSize;
            ++tupleIndex)
        {
            std::cout << attribData[
                elemIndex * attribInfo.tupleSize + tupleIndex ]
            << " ";
        }
        std::cout << std::endl;
    }
    delete [] attribData;
}
static void
processGeoPart( HAPI_Session &session, HAPI_AssetInfo &assetInfo,
        HAPI_NodeId objectNode, HAPI_NodeId geoNode,
        HAPI_PartId partId )
{
    std::cout << "Object " << objectNode << ", Geo " << geoNode
          << ", Part " << partId << std::endl;
    HAPI_PartInfo partInfo;
    ENSURE_SUCCESS( HAPI_GetPartInfo( &session, geoNode,
                      partId, &partInfo ) );
    HAPI_StringHandle * attribNamesSh = new HAPI_StringHandle[ partInfo.attributeCounts[ HAPI_ATTROWNER_POINT ] ];
    ENSURE_SUCCESS( HAPI_GetAttributeNames( &session, geoNode, partInfo.id,
                        HAPI_ATTROWNER_POINT, attribNamesSh,
                         partInfo.attributeCounts[ HAPI_ATTROWNER_POINT ] ) );
    for ( int attribIndex = 0; attribIndex < partInfo.attributeCounts[ HAPI_ATTROWNER_POINT ]; ++attribIndex)
    {
        std::string attribName = getString( attribNamesSh[ attribIndex ] );
        std::cout << "      " << attribName << std::endl;
    }
    delete [] attribNamesSh;
    std::cout << "Point Positions: " << std::endl;
    processFloatAttrib( session, assetInfo, objectNode, geoNode,
            partId, HAPI_ATTROWNER_POINT, "P" );
    
    std::cout << "Number of Faces: " << partInfo.faceCount << std::endl;
    
    if ( partInfo.type != HAPI_PARTTYPE_CURVE )
    {
        int * faceCounts = new int[ partInfo.faceCount ];
    
        ENSURE_SUCCESS( HAPI_GetFaceCounts( &session, geoNode, partId,
                            faceCounts, 0, partInfo.faceCount ) );
        for ( int ii = 0; ii < partInfo.faceCount; ++ii )
        {
            std::cout << faceCounts[ ii ] << ", ";
        }
    
        std::cout << std::endl;
        int * vertexList = new int[ partInfo.vertexCount ];
        ENSURE_SUCCESS( HAPI_GetVertexList( &session, geoNode, partId,
                            vertexList, 0, partInfo.vertexCount ) );
        std::cout << "Vertex Indices into Points array:" << std::endl;
        int currIndex = 0;
        for( int ii = 0; ii < partInfo.faceCount; ii++ )
        {
            for( int jj = 0; jj < faceCounts[ ii ]; jj++ )
            {
            std::cout
                << "Vertex :" << currIndex << ", belonging to face: "
                << ii <<", index: " 
                << vertexList[ currIndex ] << " of points array\n";
            currIndex++;
            }
        }
    
        delete [] faceCounts;
        delete [] vertexList;
    }
}

///////////////////////////////////////////////////////////////////////////////////

// just making it global for now; may make it into a separate object at some point.
HAPI_Session session;
HAPI_CookOptions cookOptions;

napi_value test(napi_env env, napi_callback_info info) {	
	napi_status status = napi_ok;
	napi_value result = nullptr;


	// ported from https://www.sidefx.com/docs/hengine/_h_a_p_i__full_source_samples__asset_inputs.html
    HAPI_NodeId newNode;
    ENSURE_SUCCESS( HAPI_CreateInputNode( &session, &newNode, "Triangle" ) );
    ENSURE_SUCCESS( HAPI_CookNode ( &session, newNode, &cookOptions ) );
    int cookStatus;
    HAPI_Result cookResult;
    do
    {
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
    
    ENSURE_SUCCESS( HAPI_SaveHIPFile( &session, "scenes/triangle.hip", false ) );
    ENSURE_SUCCESS( HAPI_SaveGeoToFile( &session, newNode, "scenes/triangle.obj" ) );
    	
    
	// HAPI_Cleanup( &session );
    // return 0;

	return (status == napi_ok) ? result : nullptr;
}

napi_value testPoint(napi_env env, napi_callback_info info) {
	napi_status status = napi_ok;
	napi_value result = nullptr;	

		// ported from https://www.sidefx.com/docs/hengine/_h_a_p_i__full_source_samples__asset_inputs.html#HAPI_FullSourceSamples_AssetInputs_MarshallingPointClouds
    HAPI_NodeId newNode;
    
    ENSURE_SUCCESS( HAPI_CreateInputNode( &session, &newNode, "Point Cloud" ) );
    ENSURE_SUCCESS( HAPI_CookNode ( &session, newNode, &cookOptions ) );
    int cookStatus;
    HAPI_Result cookResult;
    do
    {
        cookResult = HAPI_GetStatus( &session, HAPI_STATUS_COOK_STATE, &cookStatus );
    }
    while (cookStatus > HAPI_STATE_MAX_READY_STATE && cookResult == HAPI_RESULT_SUCCESS);
    ENSURE_SUCCESS( cookResult );
    ENSURE_COOK_SUCCESS( cookStatus );
    
    HAPI_GeoInfo newNodeGeoInfo;
    ENSURE_SUCCESS( HAPI_GetDisplayGeoInfo( &session, newNode, &newNodeGeoInfo ) );
    HAPI_NodeId sopNodeId = newNodeGeoInfo.nodeId;
    
    // Creating the triangle vertices
    HAPI_PartInfo newNodePart = HAPI_PartInfo_Create();
    newNodePart.type = HAPI_PARTTYPE_MESH;
    newNodePart.faceCount = 0;
    newNodePart.vertexCount = 0;
    newNodePart.pointCount = 8;
    
    ENSURE_SUCCESS( HAPI_SetPartInfo( &session, sopNodeId, 0, &newNodePart ) );
    HAPI_AttributeInfo newNodePointInfo = HAPI_AttributeInfo_Create();
    newNodePointInfo.count = 8;
    newNodePointInfo.tupleSize = 3;
    newNodePointInfo.exists = true;
    newNodePointInfo.storage = HAPI_STORAGETYPE_FLOAT;
    newNodePointInfo.owner = HAPI_ATTROWNER_POINT;
    ENSURE_SUCCESS( HAPI_AddAttribute( &session, sopNodeId, 0, "P", &newNodePointInfo ) );
    float positions[ 24 ] = { 0.0f, 0.0f, 0.0f,
                  1.0f, 0.0f, 0.0f,
                  1.0f, 0.0f, 1.0f,
                  0.0f, 0.0f, 1.0f,
                  0.0f, 1.0f, 0.0f,
                  1.0f, 1.0f, 0.0f,
                  1.0f, 1.0f, 1.0f,
                  0.0f, 1.0f, 1.0f};
    ENSURE_SUCCESS( HAPI_SetAttributeFloatData( &session, sopNodeId, 0, "P", &newNodePointInfo, positions, 0, 8 ) );
    ENSURE_SUCCESS( HAPI_CommitGeo( &session, sopNodeId ) );
    
    ENSURE_SUCCESS( HAPI_SaveHIPFile( &session, "scenes/point_cloud.hip", false ) );
    ENSURE_SUCCESS( HAPI_SaveGeoToFile( &session, newNode, "scenes/point_cloud.obj" ) );

    // HAPI_Cleanup( &session );
    // return 0;

	return (status == napi_ok) ? result : nullptr;

}

napi_value load(napi_env env, napi_callback_info info) {
    napi_status status = napi_ok;
    napi_value result = nullptr;

    HAPI_AssetLibraryId assetLibId;
    ENSURE_SUCCESS( HAPI_LoadAssetLibraryFromFile( &session, "scenes/geometry.hdanc", true, &assetLibId ) );
    int assetCount;
    ENSURE_SUCCESS( HAPI_GetAvailableAssetCount( &session, assetLibId, &assetCount ) );
    if (assetCount > 1)
    {
        std::cout << "Should only be loading 1 asset here" << std::endl;
        exit ( 1 );
    }
    
    HAPI_StringHandle assetSh;
    ENSURE_SUCCESS( HAPI_GetAvailableAssets( &session, assetLibId, &assetSh, assetCount ) );
    std::string assetName = getString( assetSh );
    HAPI_NodeId nodeId;
    ENSURE_SUCCESS( HAPI_CreateNode( &session, -1, assetName.c_str(), "TestObject", false, &nodeId ) );
    ENSURE_SUCCESS( HAPI_CookNode ( &session, nodeId, &cookOptions ) );
    int cookStatus;
    HAPI_Result cookResult;
    do
    {
        cookResult = HAPI_GetStatus( &session, HAPI_STATUS_COOK_STATE, &cookStatus );
    }
    while ( cookStatus > HAPI_STATE_MAX_READY_STATE && cookResult == HAPI_RESULT_SUCCESS );
    ENSURE_SUCCESS( cookResult );
    ENSURE_COOK_SUCCESS( cookStatus );
    
    HAPI_AssetInfo assetInfo;
    ENSURE_SUCCESS( HAPI_GetAssetInfo( &session, nodeId, &assetInfo ) );
    printCompleteNodeInfo( session, nodeId, assetInfo );
    
    //char in;
    //std::cout << "Press keys to exit." << std::endl;
    //std::cin >> in;
    
    // HAPI_Cleanup( &session );
    // return 0;

    return (status == napi_ok ) ? result : nullptr;
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
    //                        const HAPI_cookOptions * cook_options,
    //                        HAPI_Bool use_cooking_thread,
    //                        int cooking_thread_stack_size,
    //                        const char * houdini_environment_files,
    //                        const char * otl_search_path,
    //                        const char * dso_search_path,
    //                        const char * image_dso_search_path,
    //                        const char * audio_dso_search_path );
	cookOptions = HAPI_CookOptions_Create();
	ENSURE_SUCCESS( HAPI_Initialize(&session, &cookOptions, bUseCookingThread, -1, nullptr, nullptr, nullptr, nullptr, nullptr));

	// add handler to clean it up:
	napi_add_env_cleanup_hook(env, sessionCleanup, (void *)&session);

	napi_status status;
	napi_property_descriptor properties[] = {
		{ "test", 0, test, 0, 0, 0, napi_default, 0 },
		{ "testPoint", 0, testPoint, 0, 0, 0, napi_default, 0 },
        { "load", 0, load, 0, 0, 0, napi_default, 0 },
		
	};
	status = napi_define_properties(env, exports, sizeof(properties)/sizeof(napi_property_descriptor), properties);
	//assert(status == napi_ok);
	return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, init)