import FileStorage from "./file-storage";
import * as fs from "fs";

export default class LocalStorage extends FileStorage {
    public async init() {
        fs.promises.mkdir(this.ROOT_FOLDER, { recursive: true });
    }

    public async upload(filename: string, file: string): Promise<void> {
        await fs.promises.writeFile(filename, file);
    }

    private ROOT_FOLDER = './resources/temporary/files';
}