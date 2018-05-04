# The Pixel Ecosystem
We're solving the problem of verifying real human engagement, starting with influencer marketing. This is a huge problem in the media and marketing industries, as described by [NYT](https://www.nytimes.com/interactive/2018/01/27/technology/social-media-bots.html) and [Buzzfeed](https://www.buzzfeed.com/alexkantrowitz/people-are-turning-their-accounts-into-bots-on-instagram). We solve this by incentivising a Proof of Engagement from consumers with Pixelcoin (an ERC20 token). In a nutshell, consumers are able to easily earn our cryptocurrency by engaging with content they already see.

We're backed by our parent company: Crowd Mobile, a publicly listed Australian company that has been in influencer marketing for 6+ years, has run 10,000+ influencer campaigns, 250+ campaigns per month in 55+ countries, with 100+ employees in Amsterdam, Melbourne, and London. 

More details will be available in the upcoming whitepaper.

This repo contains a prototype of the *Campaign Contract* as described in the whitepaper.

For more info, see our [website](http://pixelecosystem.com/)

## Pixelcoin
The 'network' token used in the Pixel Ecosystem is an ERC20 token with the following details:

| Item  | Value |
| ------------- | ------------- |
| Standard  | ERC20  |
| Decimals | 18 |
| Name | Pixelcoin |
| Symbol | PXL |

## The Campaign Contract

This repo contains a prototype of the *Campaign Contract* as described in the whitepaper - the smart contract used for brands to hold and manage the bounty for influencer campaigns.
For this prototype:
 - a *Campaign Contract* can only be assigned to an influencer who is already whitelisted in the contract.
- the *Image Verifiers* fill the role of a *verifier*, who verifies uploads made by fans and approves them appropriately. This is performed in a separate (future) contract.
 - the Campaign's bounty can be disapproved or reimbursed by the Brand only after a specified deadline.

### Events

The campaign Smart Contracts emits the following events on the blockchain:

| Event  | Description |
| ------------- | ------------- |
| Funded  | After the brand stakes funds (in Pixelcoins) for the campaign |
| Accepted  | After an influencer joins the campaign |
| InfluencerFundsReleased  | After the influencer's upload (Proof that the campaign was completed correctly as per Brand's criteria) has been approved by the brand. Influencer gets paid. |
| FanFundsReleased  | After verifier approves a fan's upload. Fan gets paid. |
| VerifierFundsReleased  | Verifier gets paid after approving a fan. |
| Disapproved  | After the brand disapproves the influencer after the deadline. Funds reserved for the influencer's payout are returned to the brand |

## Whitelist

The whitelist Smart Contract is used to restrict the campaign so that only whitelisted influencers can join. The Fans earn their Pixelcoins after being verified by the Image Verifier, and do not have to be on the whitelist.

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
