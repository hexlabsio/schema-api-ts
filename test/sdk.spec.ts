import { Caller, CallerProps, ChickenStoreAPISdk } from '../generated/chicken-store-api/sdk';


const caller: Caller = {
  async call(props: CallerProps): Promise<{ statusCode: number; body: string; headers: Record<string, string> }> {
    return {statusCode: 200, body: '[]', headers: { 'x-uri': props.uri }};
  }
}

describe('SDK', () => {

  it('should', async () => {
    const result = await new ChickenStoreAPISdk(caller, {environment: 'prod'})
      .getChicken({chickenId: 'id'}, {}, {});
    expect(result.headers['x-uri']).toEqual('https://api.xyz.io/views')
  })
});
