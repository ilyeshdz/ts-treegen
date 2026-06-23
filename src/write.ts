import { dirname, join } from "path";
import type { VirtualFile } from "./protocol";
import { mkdir, writeFile } from "fs/promises";

export interface WriteOptions {
    targetDir?: string;
}

export async function write(files: VirtualFile[], options: WriteOptions = {}) {
    const base = options.targetDir || process.cwd();

    for (const file of files) {
        const absolutePath = join(base, file.path);

        await mkdir(dirname(absolutePath), {
            recursive: true
        })

        await writeFile(absolutePath, file.content);
    }
}