import { omitMiddlePart } from './solveLogic.js';

export function indention(num = 1, string = null) {
    if (string) {
        return string.split('\n').map(line => ' '.repeat(num * 2) + line).join('\n');
    } else {
        return ' '.repeat(num * 2);
    }
}
export function makeCodePrompt(mission, type, whatdidwedo, whattodo, evaluationText, processTransactions) {

    let output = processTransactions.at(-1).data;
    if (output) {
        output = omitMiddlePart(output);
    }

    const last = (
        processTransactions.at(-1).data !== null ?
            (output ? [
                // '---',
                '<CodeExecutionOutput>',
                // indention() + '```shell',
                indention(1, output),
                // indention() + '```',
                '</CodeExecutionOutput>',
            ] : [
                // '---',
                '<CodeExecutionOutput>',
                // indention() + '```shell',
                // indention() + '```',
                indention(1, '(no output)'),
                '</CodeExecutionOutput>',
            ]) : []
    );
    if (type === 'coding') {
        evaluationText = (evaluationText || '').trim();
        whatdidwedo = (whatdidwedo || '').trim();

        return {
            role: "user",
            content: [
                // '# Subsequent Solving of the Mission',
                // ``,
                // ``,
                '',
                ...last,
                '',
                evaluationText ? '' : '',
                evaluationText ? '<EvaluationOfPreviousTasks>' : '',
                evaluationText ? indention(1, evaluationText) : '',
                evaluationText ? '</EvaluationOfPreviousTasks>' : '',
                '',
                whatdidwedo ? '' : '',
                whatdidwedo ? '<WorkDoneSoFar>' : '',
                whatdidwedo ? indention(1, whatdidwedo) : '',
                whatdidwedo ? '</WorkDoneSoFar>' : '',
                '',
                whattodo ? '' : '',
                whattodo ? '<NextTasks>' : '',
                whattodo ? indention(1, whattodo) : '',
                whattodo ? '</NextTasks>' : '',
                '',
                'Make the code.',
                // '---',
                // '',
                // 'To do this, choose proper action.',
            ].join('\n'),
        };
    } else if (type === 'evaluation') {
        return {
            role: "user",
            content: [
                ...last,
                '',
                `<MissionEvaluation>`,
                `   <CompletionCheck>`,
                `      Does the progress so far and current output indicate mission completion?`,
                `   </CompletionCheck>`,
                `   <ActionDetermination>`,
                `      Judge what to do to complete the mission by the Output of the Execution and the history we did so far.`,
                `   </ActionDetermination>`,
                `</MissionEvaluation>`,
                ``,
                `Determine mission completion and decide next steps.`,
            ].join('\n'),
        };
    } else if (type === 'whatdidwedo') {
        return {
            role: "user",
            content: [
                ...last,
                '',
                `<OurGoal>`,
                indention(1, mission),
                `</OurGoal>`,
                '',
                '<WritingGuidelines>',
                '  <Rule>Summarize the tasks performed so far.</Rule>',
                '  <Rule>Write only the core content in a concise manner.</Rule>',
                '  <Rule>Use only simple and plain expressions.</Rule>',
                '  <Rule>Do not include code.</Rule>',
                '  <Rule>Respond in one sentence in Korean.</Rule>',
                '</WritingGuidelines>',
                '',
                'As an AI agent, please summarize the tasks performed so far.',
            ].join('\n'),
        };
    } else if (type === 'whattodo') {
        return {
            role: "user",
            content: [
                '',
                '',
                ...last,
                '',
                `<OurGoal>`,
                indention(1, mission),
                `</OurGoal>`,
                '',
                '<Instructions>',
                '  <Rule>Consider the mission and the current progress so far.</Rule>',
                '  <Rule>Determine what to do next logically.</Rule>',
                '  <Rule>Skip optional tasks.</Rule>',
                '  <Rule>Do not include code.</Rule>',
                '  <Rule>Respond in one sentence in Korean.</Rule>',
                '</Instructions>',
                '',
                '<OutputFormat>',
                '  ...를 할게요.',
                '</OutputFormat>',
                '',
                'Tell me what task to perform next right away!',
            ].join('\n'),
        };
    }
}