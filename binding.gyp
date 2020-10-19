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
					'library_dirs': [
						'<(HFS)/custom/houdini/dsolib'
					],
					'libraries': [
						'<(HFS)/custom/houdini/dsolib/libHAPIL.lib',
						'<(HFS)/custom/houdini/dsolib/libFBX.lib',
						'<(HFS)/custom/houdini/dsolib/libROP.lib',
						'<(HFS)/custom/houdini/dsolib/libGLTF.lib',
						'<(HFS)/custom/houdini/dsolib/libSYS.lib',
						'<(HFS)/custom/houdini/dsolib/libUT.lib',
						'<(HFS)/custom/houdini/dsolib/libfbxsdk_md.lib',
					],
					'defines' : [
						'WIN32_LEAN_AND_MEAN',
						'VC_EXTRALEAN'
					],
					'msvs_settings' : {
						'VCCLCompilerTool' : {
							'AdditionalOptions' : ['/Ox', '/EHsc', '/GR']
						},
						'VCLinkerTool' : {
							'AdditionalOptions' : []
						},
					},
					'copies': [
						{
							'destination': './build/Release/',
							'files': [
								"<!@(node -p \"require('fs').readdirSync('C:/Program Files/Side Effects Software/Houdini 18.0.499/bin').filter(f=>f.endsWith('.dll')).map(f=>`'C:/Program Files/Side Effects Software/Houdini 18.0.499/bin/${f}'`).join(' ')\")"
							]
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