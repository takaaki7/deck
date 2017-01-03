/* tslint:disable: no-console */
import {module} from 'angular';
import {cloneDeep} from 'lodash';

export interface ICloudProviderLogo {
  path: string;
}

export interface ICloudProviderConfig {
  name: string;
  logo?: ICloudProviderLogo;
  [attribute: string]: any;
}

export class CloudProviderRegistry {
  /*
  Note: Providers don't get $log, so we stick with console statements here
   */
  private providers: Map<string, ICloudProviderConfig> = new Map();

  static get $inject() { return ['settings']; }

  public constructor(private settings: any) {}

  public $get(): CloudProviderRegistry {
    return this;
  }

  public registerProvider(cloudProvider: string, config: ICloudProviderConfig): void {
    if (this.settings.providers && this.settings.providers[cloudProvider]) {
      this.providers.set(cloudProvider, config);
    }
  }

  public getProvider(cloudProvider: string): ICloudProviderConfig {
    return this.providers.has(cloudProvider) ? cloneDeep(this.providers.get(cloudProvider)) : null;
  }

  public listRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  public overrideValue(cloudProvider: string, key: string, overrideValue: any) {
    if (!this.providers.has(cloudProvider)) {
      console.warn(`Cannot override "${key}" for provider "${cloudProvider}" (provider not registered)`);
      return;
    }
    let config = this.providers.get(cloudProvider),
      parentKeys = key.split('.'),
      lastKey = parentKeys.pop(),
      current = config;

    parentKeys.forEach((parentKey) => {
      if (!current[parentKey]) {
        current[parentKey] = {};
      }
      current = current[parentKey];
    });

    current[lastKey] = overrideValue;
  }

  public hasValue(cloudProvider: string, key: string) {
    return this.providers.has(cloudProvider) && this.getValue(cloudProvider, key) !== null;
  }

  public getValue(cloudProvider: string, key: string): any {
    if (!key || !this.providers.has(cloudProvider)) {
      return null;
    }
    let config = this.getProvider(cloudProvider),
      keyParts = key.split('.'),
      current = config,
      notFound = false;

    keyParts.forEach((keyPart) => {
      if (!notFound && current.hasOwnProperty(keyPart)) {
        current = current[keyPart];
      } else {
        notFound = true;
      }
    });

    if (notFound) {
      console.debug(`No value configured for "${key}" in provider "${cloudProvider}"`);
      return null;
    }
    return current;
  }

}

export const CLOUD_PROVIDER_REGISTRY = 'spinnaker.core.cloudProvider.registry';
module(CLOUD_PROVIDER_REGISTRY, [
  require('core/config/settings')
]).provider('cloudProviderRegistry', CloudProviderRegistry);
