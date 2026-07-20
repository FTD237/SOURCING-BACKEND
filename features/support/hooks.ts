import { Before, After } from '@cucumber/cucumber';
import { CustomWorld } from './world';

Before(async function (this: CustomWorld) {
  await this.initApp();
});

After(async function (this: CustomWorld) {
  await this.closeApp();
});
