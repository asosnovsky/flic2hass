export type Logger = ReturnType<typeof makeLogger>;
export function makeLogger(
    prefix: string,
    debugMode: boolean = false,
) {
    return {
        info(...args: any[]) {
            console.log(`${prefix}|INFO| ${args.map(String).join('\t')}`)
        },
        error(...args: any[]) {
            console.log(`${prefix}|ERROR| ${args.map(String).join('\t')}`)
        },
        debug(...args: any[]) {
            if (debugMode) {
                console.log(`${prefix}|DEBUG| ${args.map(String).join('\t')}`)
            }
        }
    }
}