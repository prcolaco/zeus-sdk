const { uploadContract, getCreateAccount, getUrl, getNetwork } = require('./utils');
const { getEosWrapper } = require('./eos-wrapper');

const getDefaultArgs = require('../../helpers/getDefaultArgs');

async function setContractPermissions(args, account, keys, sidechain) {
  var selectedNetwork = getNetwork(args, sidechain);
  var config = {
    expireInSeconds: 120,
    sign: true,
    keyProvider: keys.active.privateKey,
    chainId: selectedNetwork.chainId
  };
  var endpoint = getUrl(args, sidechain);
  config.httpEndpoint = endpoint;

  const eos = getEosWrapper(config);
  await (await eos.contract('eosio')).updateauth({
    account,
    permission: 'active',
    parent: 'owner',
    auth: {
      threshold: 1,
      waits: [],
      keys: [{ key: keys.active.publicKey, weight: 1 }],
      accounts: [{
        permission: { actor: account, permission: 'eosio.code' },
        weight: 1

      }]
    }
  }, { authorization: `${account}@active` });
}

async function deploy(contract, account, args = getDefaultArgs(), sidechain) {
  if (!args)
    args = getDefaultArgs();
  if (!account) {
    account = contract.name;
  }
  const keys = await getCreateAccount(account, args, false, sidechain);
  await uploadContract(args, account, contract.binaryPath, sidechain);
  contract.address = account;
  var config = {
    keyProvider: keys.active.privateKey,
  };
  var endpoint = getUrl(args, sidechain);
  config.httpEndpoint = endpoint;

  await setContractPermissions(args, account, keys, sidechain);

  const eos = await getEosWrapper(config);
  const contractInstance = await eos.contract(account);

  return {
    contractInstance, // ready to go with permissions
    contract: {
      ...contract,
      address: account,
      account
    },
    account,
    address: account,
    eos,
    keys
  };
}

function createDeployer(args) {
  return {
    deploy: (contract, account, sidechain) => deploy(contract, account, args, sidechain)
  };
}

module.exports = {
  deploy,
  createDeployer
};
