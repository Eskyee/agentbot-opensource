import { getBaseWalletAddressFromSessionUser, getBaseAddressUrl, getBaseTxUrl } from '@/app/lib/base-wallet'

describe('base-wallet helpers', () => {
  test('extracts the wallet address from supported wallet email aliases', () => {
    expect(
      getBaseWalletAddressFromSessionUser({
        email: '0x1111111111111111111111111111111111111111@wallet.agentbot',
      })
    ).toBe('0x1111111111111111111111111111111111111111')

    expect(
      getBaseWalletAddressFromSessionUser({
        email: '0x2222222222222222222222222222222222222222@wallet.base.org',
      })
    ).toBe('0x2222222222222222222222222222222222222222')
  })

  test('builds basescan links for addresses and transactions', () => {
    expect(getBaseAddressUrl('0xabc')).toBe('https://basescan.org/address/0xabc')
    expect(getBaseTxUrl('0xdef')).toBe('https://basescan.org/tx/0xdef')
  })
})
