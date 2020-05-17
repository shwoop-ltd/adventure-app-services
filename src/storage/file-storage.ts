export default abstract class FileStorage {
    /**
     * 
     * @param filename Name of the image to be uploaded
     * @param file Where image will be stored
     * 
     * @throws When file does not exist
     */
    public abstract async upload(filename: string, file: string): Promise<void>;
}