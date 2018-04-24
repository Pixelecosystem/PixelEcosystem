# PixelEcosystem

## Pixelcoin

| Item  | Value |
| ------------- | ------------- |
| Standard  | ERC20  |
| Decimals | 18 |
| Name | Pixelcoin |
| Symbol | PXL |

## PixelCampaign

The Smart Contract for managing campaign funded in Pixelcoins.
Campaign, created by a brand, can be joined by an influencer (whitelisted only).
There is also a role of a *verifier*, who verifies uploads made by fans.
The Campaign can be disapproved/reimbursed by the brand (only after specified deadline).

### Events

The campaign Smart Contracts emits the following events on the blockchain:

| Event  | Description |
| ------------- | ------------- |
| Funded  | After the brand stakes funds (in Pixelcoins) for the campaign |
| Accepted  | After an influencer joins the campaign |
| InfluencerFundsReleased  | After the influencer's upload has been approved by the brand. Influencer gets paid. |
| FanFundsReleased  | After verifier approves a fan's upload. Fan gets paid. |
| VerifierFundsReleased  | Verifier gets paid after approving a fan. |
| Disapproved  | After the brand disapproves the influencer after the deadline. Funds reserved for the influencer's payout are returned to the brand |

## Whitelist

The whitelist Smart Contract is used to restrict the campaign so that only whitelisted influencers can join. The fans are getting paid after being verified by the Verifier, and do not have to be on the whitelist.

## Deploying and testing

### Deploying

If you are running Parity node on your device you can deploy the contracts with placeholder values (like deadline or soft criteria) using the following command:

```javascript
npm run deploy
```

Placeholder values can be changed in **scripts/deploy.js** file.

### ABI

ABI (Application binary interface) files located in **abi** folder.

### Testing

There is an extensive set of tests that can be run using the following command:
```javascript
npm run dev:test
```
