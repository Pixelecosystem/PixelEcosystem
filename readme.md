# PixelEcosystem

## PixelToken


| Item  | Value |
| ------------- | ------------- |
| Standard  | ERC20  |
| Decimals | 18 |
| Name | PixelToken |
| Symbol | PXL |

## PixelCampaign

The Smart Contract for managing campaign funded in PixelTokens. The campaign is created by a Brand.
Campaign can be joined by an Influencer (whitelisted only).
There is also a role of Verifier, who verifies uploads made by fans.
The Campaign can be disapproved/reimbursed by the Brand after specified deadline.

### Events

The campaign Smart Contracts emits the following events on the blockchain:

| Event  | Description |
| ------------- | ------------- |
| Funded  | After the Brand stakes funds in PixelToken for the campaign |
| Accepted  | After an Influencer joins the campaign |
| InfluencerFundsReleased  | After the Influencer's upload has been approved by the Brand. Influencer gets paid. |
| FanFundsReleased  | After verifier approves a fan's upload. Fan gets paid. |
| VerifierFundsReleased  | Same as FanFundsReleased, Verifier gets paid. |
| Disapproved  | After the brand disapproves the Influencer after the deadline. Tokens reserved for the Influencer are returned to the Brand |

## Whitelist

The whitelist Smart Contract is used to restrict the campaign so that only whitelisted Influencers can join. The fans are getting paid after being verified by the Verifier, and do not have to be on the Whitelist.

## Deploying

If you are running Parity node on your device you can deploy the contracts with placeholder values (like deadline or soft criteria) using the following command:

```javascript
npm run deploy
```

Placeholder values can be changed in **scripts/deploy.js** file.

## Parity wallet

If you are using the Parity Wallet, you can watch the smart contracts by importing ABI files located in **abi** folder.

## Tests

There is an extensive set of tests that can be run using the following command:
```javascript
npm run dev:test
```
