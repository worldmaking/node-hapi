{
	"targets":[
		{
			"target_name": "hapi",
			"sources": [ "src/node-hapi.cpp" ],
			'include_dirs': [
				'src',
			],
			'conditions': [
        		['OS=="win"', {
					'include_dirs': [
						'C:/Program Files/Side Effects Software/Houdini 18.0.499/toolkit/include/',
					],
					'library_dirs': [],
					'libraries': [
						'C:/Program Files/Side Effects Software/Houdini 18.0.499/custom/houdini/dsolib/libHAPI.lib'
					],
					'defines' : [
						'WIN32_LEAN_AND_MEAN',
						'VC_EXTRALEAN'
					],
					'msvs_settings' : {
					},
					
				}],
        		['OS=="mac"', {

				}],
        		['OS=="linux"', {

				}],
			],
		}
	]
}