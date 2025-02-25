import axios from 'axios';
import { getToolCode, getToolData, convertJsonToResponseFormat, sortKeyOfObject } from './system.js';
export async function actDataParser({ actData }) {
    const actDataCloneBackedUp = JSON.parse(JSON.stringify(actData));
    let toolingFailed = false;
    function shellCommander(shellCommand) {
        return [
            `const { spawnSync, spawn } = require('child_process');`,
            `const fs = require('fs');`,
            `const outputPath = '/code.sh';`,
            `fs.writeFileSync(outputPath, '${Buffer.from(shellCommand, 'utf-8').toString('base64')}');`,
            `const code = fs.readFileSync(outputPath, 'utf-8');`,
            `fs.writeFileSync(outputPath, Buffer.from(code, 'base64').toString('utf-8'));`,
            `fs.chmodSync(outputPath, '755');`,
            //-----------------------------------
            `{`,
            `    const child = spawn(outputPath, { shell: true });`,
            `    child.stdout.setEncoding('utf8');`,
            `    child.stderr.setEncoding('utf8');`,
            `    async function main() {`,
            `        let stdout = '';`,
            `        let stderr = '';`,
            `        child.stdout.on('data', (data) => {`,
            `            process.stdout.write(data);`,
            `            stdout += data;`,
            `        });`,
            `        child.stderr.on('data', (data) => {`,
            `            process.stderr.write(data);`,
            `            stderr += data;`,
            `        });`,
            `        child.on('error', (err) => {`,
            `            process.exit(1)`,
            `        });`,
            `        const result = await new Promise((resolve, reject) => {`,
            `            child.on('close', (code) => {`,
            `                resolve({`,
            `                    code,`,
            `                    stdout,`,
            `                    stderr`,
            `                })`,
            `            });`,
            `        });`,
            `        if (stdout.trim().length === 0 && stderr.trim().length === 0) console.log('(No output result)');`,
            `        process.exit(result.code);`,
            `    }`,
            `    main();`,
            `}`,
        ].join('\n');
    }
    function is_none_data(data) {
        if (data === undefined) return true;
        if (data === '') return true;
        return false;
    }
    async function loadToolCode(actData) {
        const code = await getToolCode(actData.name);
        if (!code) return '';
        return [
            // code,
            `(async()=>{try{await (${code})(${JSON.stringify(actData.input)});}catch{}})();`,
        ].join('\n');
    }
    let javascriptCode, requiredPackageNames, pythonCode, javascriptCodeBack;
    try {


        if (actData.name === 'generate_nodejs_code') {
            if (is_none_data(actData?.input?.nodejs_code)) throw null;
            javascriptCode = actData.input.nodejs_code;
            requiredPackageNames = actData.input.npm_package_list;
        } else if (actData.name === 'generate_nodejs_code_for_puppeteer') {
            if (is_none_data(actData?.input?.nodejs_code)) throw null;
            javascriptCode = actData.input.nodejs_code;
            requiredPackageNames = actData.input.npm_package_list;
        } else if (actData.name === 'generate_python_code') {
            if (is_none_data(actData?.input?.python_code)) throw null;
            pythonCode = actData.input.python_code;
            requiredPackageNames = actData.input.pip_package_list;
        } else if (actData.name === 'list_directory') {
            if (is_none_data(actData?.input?.directory_path)) throw null;
            if (!actData.input.directory_path) actData.input.directory_path = './';
            actData.input.directory_path = `${actData.input.directory_path}/`;
            while (actData.input.directory_path.includes('//')) actData.input.directory_path = actData.input.directory_path.replace('//', '/');
            javascriptCode = [
                `const listDirectory = require('listDirectory');`,
                `console.log(await listDirectory('${actData.input.directory_path}'));`,
            ].join('\n');
            javascriptCodeBack = await loadToolCode(actData);
        } else if (actData.name === 'apt_install') {
            if (is_none_data(actData?.input?.package_name)) throw null;
            javascriptCode = [
                `const aptInstall = require('aptInstall');`,
                `console.log(await aptInstall('${actData.input.package_name}'));`,
            ].join('\n');
            javascriptCodeBack = shellCommander(`apt install -y ${actData.input.package_name}`);
        } else if (actData.name === 'which_command') {
            if (is_none_data(actData?.input?.command)) throw null;
            javascriptCode = [
                `const whichCommand = require('whichCommand');`,
                `console.log(await whichCommand('${actData.input.command}'));`,
            ].join('\n');
            javascriptCodeBack = await loadToolCode(actData);
        } else if (actData.name === 'run_command') {
            if (is_none_data(actData?.input?.command)) throw null;
            javascriptCode = [
                actData.input.command,
            ].join('\n');
            javascriptCodeBack = shellCommander(actData.input.command);
        } else if (actData.name === 'read_file') {
            if (is_none_data(actData?.input?.file_path)) throw null;
            javascriptCode = [
                `const readFile = require('readFile');`,
                `console.log(await readFile('${actData.input.file_path}'));`,
            ].join('\n');
            javascriptCodeBack = await loadToolCode(actData);
        } else if (actData.name === 'remove_file') {
            if (is_none_data(actData?.input?.file_path)) throw null;
            javascriptCode = [
                `const removeFile = require('removeFile');`,
                `console.log(await removeFile('${actData.input.file_path}'));`,
            ].join('\n');
            javascriptCodeBack = await loadToolCode(actData);
        } else if (actData.name === 'remove_directory_recursively') {
            if (is_none_data(actData?.input?.directory_path)) throw null;
            javascriptCode = [
                `const removeDirectory = require('removeDirectory');`,
                `console.log(await removeDirectory('${actData.input.directory_path}'));`,
            ].join('\n');
            javascriptCodeBack = await loadToolCode(actData);
        } else if (actData.name === 'rename_file_or_directory') {
            if (is_none_data(actData?.input?.old_path)) throw null;
            if (is_none_data(actData?.input?.new_path)) throw null;
            javascriptCode = [
                `const renameFileOrDirectory = require('renameFileOrDirectory');`,
                `console.log(await renameFileOrDirectory('${actData.input.old_path}', '${actData.input.new_path}'));`,
            ].join('\n');
            javascriptCodeBack = await loadToolCode(actData);
        } else if (actData.name === 'read_url') {
            if (is_none_data(actData?.input?.url)) throw null;
            const url = actData.input.url;
            const result = await axios.get(url);
            let data = result.data;
            if (typeof data !== 'string') data = JSON.stringify(data);
            let ob = { data };
            javascriptCode = [
                `const axios = require('axios');`,
                `const result = await axios.get('${url}');`,
                `console.log('🌏 Contents of ${url}');`,
                `console.log(result.data);`,
            ].join('\n');
            javascriptCodeBack = [
                `console.log('🌏 Contents of ${url}');`,
                `console.log((${JSON.stringify(ob)}).data);`,
            ].join('\n');
        } else if (actData.name === 'cdnjs_finder') {
            if (is_none_data(actData?.input?.package_name)) throw null;
            const packageName = actData.input.package_name;
            const result = await axios.get('https://api.cdnjs.com/libraries?search=' + packageName + '&fields=description,version');
            let data = result.data;
            if (typeof data === 'string') data = JSON.parse(data);
            let url_list1 = data.results.filter(packageInfo => packageInfo.latest.includes('.umd.') && packageInfo.latest.endsWith('.js'))
            let sum = [...url_list1];
            let printData = sum.map(a => `${a.name} - ${a.latest}`).join('\n');
            if (sum.length === 0) printData = 'NOT FOUND';
            javascriptCode = [
                `const cdnjsFinder = require('cdnjsFinder');`,
                `const cdnLibraryURL = await cdnjsFinder('${actData.input.package_name}');`,
                `console.log('🌏 CDN Library URL of ${actData.input.package_name}');`,
                `console.log(cdnLibraryURL);`,
            ].join('\n');
            javascriptCodeBack = [
                `console.log('🌏 CDN Library URL of ${actData.input.package_name}');`,
                `console.log((${JSON.stringify({ printData })}).printData);`,
            ].join('\n');
        } else {
            // other tool
            const name = actData.name;
            const input = JSON.parse(JSON.stringify(actData.input));
            const { spec, npm_package_list } = await getToolData(name);
            const rule = spec.input_schema[0];
            const desc = spec.input_schema[1];
            const structure1 = JSON.stringify(convertJsonToResponseFormat(sortKeyOfObject(rule), desc))
            const structure2 = JSON.stringify(convertJsonToResponseFormat(sortKeyOfObject(input), desc))
            if (structure1 === structure2) {
                javascriptCode = javascriptCodeBack = await loadToolCode(actData);
                if (npm_package_list) requiredPackageNames = npm_package_list;
            }
        }
        /*
            코드 수행결과 javascriptCode || pythonCode 둘중에 하나는 존재해야해.
            둘다 없다면 LLM이 Tooling 실패했다고 봐야해.
            실패했다면 actData 어떤 모습인지 확인할 수 있도록 actDataCloneBackedUp 준비했어.
        */
        if (!javascriptCode && !pythonCode) toolingFailed = true;
        return { javascriptCode, requiredPackageNames, pythonCode, javascriptCodeBack, toolingFailed, actDataCloneBackedUp };
    } catch {
        return {
            toolingFailed
        }
    }

}