#include "node-api-helpers.h"

napi_value test(napi_env env, napi_callback_info info) {
	napi_status status = napi_ok;
	napi_value args[1];
	napi_value result = nullptr;
	return (status == napi_ok) ? result : nullptr;
}

napi_value init(napi_env env, napi_value exports) {
	napi_status status;
	napi_property_descriptor properties[] = {
		{ "test", 0, test, 0, 0, 0, napi_default, 0 },
		
	};
	status = napi_define_properties(env, exports, sizeof(properties)/sizeof(napi_property_descriptor), properties);
	//assert(status == napi_ok);
	return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, init)