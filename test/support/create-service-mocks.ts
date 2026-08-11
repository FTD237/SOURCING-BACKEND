/**
 * Objet mock où chaque méthode listée de TService devient un
 * jest.MockedFunction correctement typé (même signature que la méthode réelle).
 */
export type ServiceMocks<TService, K extends keyof TService> = {
  [P in K]: TService[P] extends (...args: infer A) => infer R
    ? jest.MockedFunction<(...args: A) => R>
    : never;
};

/**
 * Crée un mock de service typé, prêt à être injecté via
 * `{ provide: MyService, useValue: mocks }`.
 *
 * Usage:
 *   let mocks: ServiceMocks<EtudiantService, 'create' | 'findAll' | 'findOne' | 'update' | 'remove'>;
 *
 *   beforeEach(async () => {
 *     mocks = createServiceMocks<EtudiantService>()([
 *       'create', 'findAll', 'findOne', 'update', 'remove',
 *     ]);
 *
 *     const module = await createControllerTestingModule(EtudiantController, [
 *       { provide: EtudiantService, useValue: mocks },
 *     ]);
 *     controller = module.get(EtudiantController);
 *   });
 *
 *   // dans un test :
 *   mocks.create.mockResolvedValue(...);
 *   expect(mocks.create).toHaveBeenCalledWith(...);
 *
 * Le curry `createServiceMocks<TService>()(methodNames)` permet de préciser
 * TService explicitement tout en laissant TypeScript inférer K depuis le
 * tableau littéral passé en second appel.
 */
export function createServiceMocks<TService>() {
  return <K extends keyof TService>(
    methodNames: readonly K[],
  ): ServiceMocks<TService, K> => {
    const mocks = {} as ServiceMocks<TService, K>;
    for (const name of methodNames) {
      mocks[name] = jest.fn() as unknown as ServiceMocks<TService, K>[K];
    }
    return mocks;
  };
}
