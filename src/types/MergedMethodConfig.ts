export interface MergedMethodConfig {
  separator: {
    preLog?: string;
    postLog?: string;
    color?: string;
    skipOnEmptyLog?: boolean;
  };
  showFileName: boolean;
  showFunctionName: boolean;
  addNewLine: boolean;
}
