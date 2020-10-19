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
					'variables': {
						'HFS': 'C:/Program Files/Side Effects Software/Houdini 18.0.597'
					},
					'include_dirs': [
						'<(HFS)/toolkit/include/'
					],
					'library_dirs': [],
					'libraries': [
						'<(HFS)/custom/houdini/dsolib/libHAPIL.lib',
					],
					'defines' : [
						'WIN32_LEAN_AND_MEAN',
						'VC_EXTRALEAN'
					],
					'msvs_settings' : {
						'VCCLCompilerTool' : {
							'AdditionalOptions' : ['/Ox', '/EHsc']
						},
						'VCLinkerTool' : {
							'AdditionalOptions' : []
						},
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