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

static std::string getLastError() {
    int bufferLength;
    HAPI_GetStatusStringBufLength( nullptr,
                   HAPI_STATUS_CALL_RESULT,
                   HAPI_STATUSVERBOSITY_ERRORS,
                   &bufferLength );
    char * buffer = new char[ bufferLength ];
    HAPI_GetStatusString( nullptr, HAPI_STATUS_CALL_RESULT, buffer, bufferLength );
    std::string result( buffer );
    delete [] buffer;
    return result;
}

///////////////////////////////////////////////////////////////////////////////////

// just making it global for now; may make it into a separate object at some point.
HAPI_Session session;

napi_value test(napi_env env, napi_callback_info info) {
	napi_status status = napi_ok;
	//napi_value args[1];
	napi_value result = nullptr;
	return (status == napi_ok) ? result : nullptr;
}

napi_value init(napi_env env, napi_value exports) {

	int major=0, minor=0, rev=0;
	HAPI_GetEnvInt(HAPI_ENVINT_VERSION_HOUDINI_MAJOR, &major);
	HAPI_GetEnvInt(HAPI_ENVINT_VERSION_HOUDINI_MINOR, &minor);
	HAPI_GetEnvInt(HAPI_ENVINT_VERSION_HOUDINI_BUILD, &rev);
	printf("Node-HAPI built for Houdini version %d.%d.%d\n", major, minor, rev);	

	// // start up Houdini:
	// HAPI_DECL HAPI_Initialize( const HAPI_Session * session,
    //                        const HAPI_CookOptions * cook_options,
    //                        HAPI_Bool use_cooking_thread,
    //                        int cooking_thread_stack_size,
    //                        const char * houdini_environment_files,
    //                        const char * otl_search_path,
    //                        const char * dso_search_path,
    //                        const char * image_dso_search_path,
    //                        const char * audio_dso_search_path );
	HAPI_CookOptions cookoptions = HAPI_CookOptions_Create();
	
	HAPI_CreateInProcessSession(&session);
	ENSURE_SUCCESS( HAPI_Initialize(&session, &cookoptions, false, -1, nullptr, nullptr, nullptr, nullptr, nullptr));

	napi_status status;
	napi_property_descriptor properties[] = {
		{ "test", 0, test, 0, 0, 0, napi_default, 0 },
		
	};
	status = napi_define_properties(env, exports, sizeof(properties)/sizeof(napi_property_descriptor), properties);
	//assert(status == napi_ok);
	return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, init)