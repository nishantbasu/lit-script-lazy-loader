import { ReactiveControllerHost } from "@lit/reactive-element/reactive-controller.js";

export interface ExportedModuleFunctionModel {
  functionName?: string;
  args?: any[];
}

export interface LoaderOptions {
  exportedModuleFunction?:
    | ExportedModuleFunctionModel
    | ExportedModuleFunctionModel[]
    | undefined;
  successCallBack?: Function | Function[] | undefined;
  failureCallBack?: Function | Function[] | undefined;
}

export interface LazyLoaderErrorObject {
  url: string;
  errorMessage: string;
  errorStack: string;
}

export class LitScriptLazyLoaderController {
  private host: ReactiveControllerHost;
  private _fetchedScript: boolean = true;
  private _stopRenderUntilFetchedOrOnError: boolean = false;

  constructor(host: ReactiveControllerHost, deferUpdate?: boolean) {
    this.host = host;
    if (deferUpdate === true) {
      this.fetchedScript = false;
      this._stopRenderUntilFetchedOrOnError = deferUpdate;
    }
  }

  public loadScript(
    scriptUrl: string | [string],
    loaderOptions?: LoaderOptions
  ) {
    if (typeof scriptUrl === "string") {
      scriptUrl = [scriptUrl];
    }
    if (Array.isArray(scriptUrl) && scriptUrl.length > 0) {
      for (let i = 0; i < scriptUrl.length; i++) {
        //type check
        if (
          typeof scriptUrl[i] === "undefined" ||
          typeof scriptUrl[i] !== "string"
        ) {
          throw new Error(`${scriptUrl[i]} is not Valid`);
        }
        //set successCallBack
        let successCallBackFunction: Function | undefined;
        if (loaderOptions?.successCallBack) {
          if (Array.isArray(loaderOptions.successCallBack)) {
            successCallBackFunction = loaderOptions.successCallBack[i] ?? null;
          } else {
            successCallBackFunction = loaderOptions.successCallBack;
          }
        }
        //set failureCallBack
        let failureCallBackFunction: Function | undefined;
        if (loaderOptions?.failureCallBack) {
          if (Array.isArray(loaderOptions.failureCallBack)) {
            failureCallBackFunction = loaderOptions.failureCallBack[i] ?? null;
          } else {
            failureCallBackFunction = loaderOptions.failureCallBack;
          }
        }
        //set moduleFunctions
        let moduleFunction: ExportedModuleFunctionModel | undefined;
        if (loaderOptions?.exportedModuleFunction) {
          if (Array.isArray(loaderOptions.exportedModuleFunction)) {
            moduleFunction = loaderOptions.exportedModuleFunction[i] ?? null;
          } else {
            moduleFunction = loaderOptions.exportedModuleFunction;
          }
        }

        //fetch script
        this.fetchScript(
          scriptUrl[i],
          moduleFunction,
          successCallBackFunction,
          failureCallBackFunction
        );
      }
    }
  }

  private fetchScript(
    url: string,
    moduleFunction?: ExportedModuleFunctionModel | undefined,
    successCallBack?: Function | undefined,
    failureCallBack?: Function | undefined
  ) {
    import(url)
      .then(async (module) => {
        this.fetchedScript = true;
        await this.host.updateComplete;
        if (moduleFunction?.functionName) {
          const exportedFunction = (module as any)[moduleFunction.functionName];
          if (exportedFunction) {
            if (moduleFunction?.args) {
              exportedFunction(...moduleFunction.args);
            } else {
              exportedFunction();
            }
          }
        }
        if (successCallBack) {
          successCallBack();
        }
      })
      .catch((error) => {
        this.fetchedScript = false;
        const errorObject = <LazyLoaderErrorObject>{
          url: url,
          errorMessage: error.message,
          errorStack: error.stack,
        };
        if (failureCallBack) {
          failureCallBack(errorObject);
        }
      });
  }

  set fetchedScript(value: boolean) {
    this._fetchedScript = value;
    if (this._stopRenderUntilFetchedOrOnError && this._fetchedScript) {
      this.host.requestUpdate();
    }
  }

  get fetchedScript() {
    return this._fetchedScript;
  }
}
