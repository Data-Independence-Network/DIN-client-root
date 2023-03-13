import { spawn } from 'child_process';

const sapotoStage1Build = {
    project: 'sapoto.net',
    componentsInBuildOrder: [
        'libs/dependency-injection',
        'apps/core'
    ]
}

const votecubeBuild = {
    project: 'votecube.com',
    componentsInBuildOrder: [
        'libs/dependency-injection',
        'schemas/votecube'
    ]
}

const sapotoStage2Build = {
    project: 'sapoto.net',
    componentsInBuildOrder: [
        'apps/host',
        'apps/main'
    ]
}

const votecubeUiBuild = {
    project: 'votecube.com',
    uiType: 'Angular',
    componentsInBuildOrder: [
        'UI/react/components',
        'UI/react/main'
    ]
}

const sapotoUiBuild = {
    project: 'sapoto.net',
    uiType: 'Angular',
    componentsInBuildOrder: [
        'UI/react/components',
        'UI/react/main'
    ]
}

try {
    // Often build fails because (apparently) the dependency links
    // still point to old version of dist directories, when commenting
    // out other build steps, unless are accutely aware of this and
    // that you have to re-run 'rush update' manually in those cases)
    // do not comment out 'wireInDependencies' (which is `rush update`)
    await wireInDependencies('.')

    await execute('npm', ['run', 'build'], '.')

    await buildPeerProjects(sapotoStage1Build)
    await buildPeerProjects(votecubeBuild)
    await buildPeerProjects(sapotoStage2Build)
    // await buildUI(votecubeUiBuild)
    // await buildUI(sapotoUiBuild)
} catch (e) {
    console.log(e)
}

async function buildPeerProjects(
    stageDescriptor
) {
    process.chdir('./' + stageDescriptor.project);

    await buildProjects(
        stageDescriptor.componentsInBuildOrder,
        'npm', ['run', 'build']
    );

    process.chdir('..');
}

async function buildUI(
    stageDescriptor
) {
    process.chdir('./' + stageDescriptor.project);

    await buildProjects(
        stageDescriptor.componentsInBuildOrder,
        'npm', ['run', 'build']
    );

    process.chdir('..');
}

async function buildProjects(
    projectsDescriptorsInBuildOrder,
    command,
    parameters
) {
    for (const projectDescriptor of projectsDescriptorsInBuildOrder) {
        // let isApp = false;
        let projectDirectory
        // if (projectDescriptor instanceof Object) {
        //     projectDirectory = projectDescriptor.directory
        //     isApp = projectDescriptor.isApp
        // } else 
        if (typeof projectDescriptor === 'string') {
            projectDirectory = projectDescriptor
        } else {
            throw `Expecting either object or string as a Project Descriptor.`
        }
        const directoryDepth = projectDirectory.split('/');
        let navigateBackPath = '..'
        for (let i = 1; i < directoryDepth.length; i++) {
            navigateBackPath = '../' + navigateBackPath
        }
        // console.log(`Changing directory to: ./${projectDirectory}`)
        process.chdir('./' + projectDirectory);

        // if (isApp) {
        //     await execute('node', ['generate.mjs'], projectDirectory);
        // }

        await execute(command, parameters, projectDirectory);

        process.chdir(navigateBackPath);
    };
}

async function wireInDependencies(
    locationDir
) {
    await execute('rush', ['update'], locationDir)
}

async function execute(
    command,
    parameters,
    projectDirectory
) {
    return new Promise((resolve, _reject) => {
        if (/^win/.test(process.platform)) {
            parameters = [
                '/s',
                '/c',
                command,
                ...parameters
            ]
            command = 'cmd'
        }

        process.stdout.write(`
        RUNNING '${command} ${parameters.join(' ')}' in ${process.cwd()}
    
        `)

        const runCommand = spawn(command, parameters);

        runCommand.stdout.on("data", data => {
            console.log(`${data}`)
        });

        runCommand.stderr.on("data", data => {
            console.log(`${data}`)
        });

        runCommand.on('error', (error) => {
            console.log(`${error.message}`);
        });

        runCommand.on("close", code => {
            console.log(`
        ${code ? 'ERROR' : 'DONE'}: '${command} ${parameters.join(' ')}' in ${process.cwd()}

    `);
            resolve(code)
        });
    }).then((returnCode) => {
        if (returnCode != 0) {
            throw new Error(`
        Suspending after ${projectDirectory}
        `)
        }

        return returnCode
    })

}
