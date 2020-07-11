{
	"targets":[
		{
			"target_name": "hapi",
			"sources": [ "src/node-hapi.cpp" ],
			'include_dirs': [
				'src'
			],
			'conditions': [
        		['OS=="win"', {
					'include_dirs': [],
					'library_dirs': [],
					'libraries': [],
					'defines' : [
						'WIN32_LEAN_AND_MEAN',
						'VC_EXTRALEAN'
					],
					'msvs_settings' : {
					},
					'copies': [
						{
							'destination': './build/Release/',
							'files': []
						}
					]
				}],
        		['OS=="mac"', {

				}],
        		['OS=="linux"', {

				}],
			],
		}
	]
}