import { readonly } from "vue";
import {
  Account,
  Address,
  Deadline,
  EncryptedMessage,
  // NetworkCurrencyMosaic,
  Mosaic,
  MosaicId,
  UInt64,
  MosaicProperties,
  MosaicSupplyType,
  FeeCalculationStrategy,
  // MosaicService,
  MosaicNonce,
  PlainMessage,
  TransferTransaction,
  TransactionHttp,
  TransactionBuilderFactory,
  PublicAccount,
  NetworkType,
  calculateFee,
  TransactionBuilder,
  Password,
} from "tsjs-xpx-chain-sdk";
import { BuildTransactions } from '@/util/buildTransactions';
import { announceAggregateBonded, announceLockfundAndWaitForConfirmation } from '../util/listener.js';
//line246
// import { mergeMap, timeout, filter, map, first, skip } from 'rxjs/operators';
import { environment } from '../environment/environment.js';
import { networkState } from "@/state/networkState";
import { NetworkStateUtils } from "@/state/utils/networkStateUtils";
import { walletState } from "@/state/walletState";
import { ChainUtils } from '@/util/chainUtils';
import { WalletUtils } from '@/util/walletUtils'
import { Helper } from "@/util/typeHelper";
const config = require("@/../config/config.json");


async function getAccInfo(address :string) :Promise<PublicAccount> {
  // return await getPublicKey(recipientAddress, siriusStore.accountHttp);

  let accountInfo = await WalletUtils.getAccInfo(address).then(accountinfo => accountinfo.publicAccount);
  return accountInfo;
}


// export const getMosaicsAllAccounts = (appStore, siriusStore) => {
//   const wallet = appStore.getWalletByName(appStore.state.currentLoggedInWallet.name);
//   wallet.accounts.forEach((account) => {
//     const mosaicService = new MosaicService(siriusStore.accountHttp, siriusStore.mosaicHttp, siriusStore.namespaceHttp);
//     const address = Address.createFromRawAddress(account.address);
//     mosaicService
//       .mosaicsAmountViewFromAddress(address)
//       .pipe(
//           mergeMap((_) => _)
//       )
//       .subscribe(mosaic => {
//         console.warn(mosaic)
//         // account.mosaic.push({ id: mosaic.fullName(), amount: mosaic.relativeAmount(), divisibility: mosaic.mosaicInfo.divisibility });
//       },
//         err => console.error(err));
//   });
// };

export const createTransaction = async (recipient :string, sendXPX :string, messageText :string, mosaicsSent :{amount: number ,id :string}[], mosaicDivisibility :number[], walletPassword :string, senderAccName :string, cosigner :string, encryptedMsg :string) : Promise<announceAggregateBonded> => {
  // verify password
  // console.log('Pw after createTransaction: ' + walletPassword);
  let verify = WalletUtils.verifyWalletPassword(walletState.currentLoggedInWallet.name, networkState.chainNetworkName, walletPassword)
  /*let verify = appStore.verifyWalletPassword(appStore.state.currentLoggedInWallet.name, walletPassword); 
 */
  if (!verify) {
    return verify;
  }

  const hash = networkState.currentNetworkProfile.generationHash
  /* const add = fetch(siriusStore._buildAPIEndpointURL(siriusStore.state.selectedChainNode) + '/block/1').then((res) => res.json()).then((data) => { return data.meta.generationHash }); */


  let networkType = networkState.currentNetworkProfile.network.type
  const recipientAddress = recipient;

  let xpxAmount = parseFloat(sendXPX) * Math.pow(10, 6);

  let mosaics = [];
  if (xpxAmount > 0) {
    mosaics.push(new Mosaic(new MosaicId(networkState.currentNetworkProfile.network.currency.assetId), UInt64.fromUint(Number(xpxAmount))));
  }
  if (mosaicsSent.length > 0) {
    mosaicsSent.forEach((mosaicSentInfo, index) => {
      if (mosaicSentInfo.amount > 0) {
        mosaics.push(
          new Mosaic(
            new MosaicId(mosaicSentInfo.id),
            UInt64.fromUint(Number(mosaicSentInfo.amount * Math.pow(10, mosaicDivisibility[index])))
          )
        );
      }
    });
  }
  let transactionBuilder = new BuildTransactions(networkType)
  /* let transactionBuilder = new TransactionBuilderFactory(); */
  // calculate fee strategy

  if (ChainUtils.getNetworkType(networkState.currentNetworkProfile.network.type) === NetworkType.PRIVATE || ChainUtils.getNetworkType(networkState.currentNetworkProfile.network.type) === NetworkType.PRIVATE_TEST) {
    transactionBuilder.setFeeStrategy(FeeCalculationStrategy.ZeroFeeCalculationStrategy) ;
    //FeeCalculationStrategy.ZeroFeeCalculationStrategy
  }

  // to get sender's private key
  let accountDetails, multisigAccountDetails, multisigPublicAccount;
  if (!cosigner) { // no cosigner, get private key from sender acc name
    accountDetails = walletState.currentLoggedInWallet.accounts.find((element) => element.name === senderAccName);
  } else {
    // a multisig, get cosigner's private key
    accountDetails = walletState.currentLoggedInWallet.accounts.find((element) => element.address === cosigner);
    // get multisig account info
    multisigAccountDetails = walletState.currentLoggedInWallet.accounts.find((element) => element.name === senderAccName).publicKey;
    multisigPublicAccount = PublicAccount.createFromPublicKey(multisigAccountDetails, networkType);
  }

  /* console.log('Getting acc details from: ' + accountDetails.address); */
  
  let privateKey = WalletUtils.decryptPrivateKey(new Password(walletPassword), accountDetails.encrypted, accountDetails.iv)


  // sending encrypted message

  let msg;
  if (encryptedMsg) {
    let accountInfo = await getAccInfo(recipientAddress)
    msg = EncryptedMessage.create(messageText, accountInfo, privateKey);
  } else {
    msg = PlainMessage.create(messageText);
  }

  let transferTransaction = transactionBuilder.transfer(Address.createFromRawAddress(recipientAddress),msg,mosaics)

  const account = Account.createFromPrivateKey(privateKey, networkType);
  const transactionHttp = new TransactionHttp(NetworkStateUtils.buildAPIEndpointURL(networkState.selectedAPIEndpoint));

  if (!cosigner) { // no cosigner, normal transaction
    const signedTransaction = account.sign(transferTransaction, hash);
    transactionHttp
      .announce(signedTransaction)
      .subscribe(() => {
        return true;
      }, err => console.error(err));
  } else { // there is a cosigner, aggregate transaction
    console.log('multisigPublicAccount');
    console.log(multisigPublicAccount);
    const innerTxn = [transferTransaction.toAggregate(multisigPublicAccount)];

    const aggregateBondedTransaction = transactionBuilder.aggregateBonded(innerTxn)
    console.log('aggregateBondedTransaction');
    console.log(aggregateBondedTransaction);
    // if (otherCosigners.length > 0) {
    //   return cosignatoryAccount.signTransactionWithCosignatories(bondedCreated, otherCosigners, generationHash);
    // }
    const aggregateBondedTransactionSigned = account.sign(aggregateBondedTransaction, hash);
    console.log('aggregateBondedTransactionSigned');
    console.log(aggregateBondedTransactionSigned);
    const hashLockTransaction = transactionBuilder.hashLock(new Mosaic(new MosaicId(environment.mosaicXpxInfo.id), UInt64.fromUint(Number(10000000))),UInt64.fromUint(environment.lockFundDuration),aggregateBondedTransactionSigned)
    const hashLockTransactionSigned = account.sign(hashLockTransaction, hash);

    (async () => {
      try {
        const confirmedTx = await announceLockfundAndWaitForConfirmation(account.address, hashLockTransactionSigned, hashLockTransactionSigned.hash, transactionHttp);
        console.log('confirmedTx');
        console.log(confirmedTx);
        // eslint-disable-next-line no-unused-vars
        let aggregateTx = await announceAggregateBonded(account.address, aggregateBondedTransactionSigned, aggregateBondedTransactionSigned.hash, confirmedTx, transactionHttp)
        console.log('aggregateTx');
        console.log(aggregateTx);
        console.log("Done");
      } catch (error) {
        console.log(error);
      }
    })();
  }

}

/* export const mosaicTransaction = (divisibility, supply, duration, durationType, mutable, transferable, walletPassword, accountName, appStore, siriusStore) => {

  // verify password

  let verify = WalletUtils.verifyWalletPassword(walletState.currentLoggedInWallet.name, networkState.chainNetworkName, walletPassword)
  
 
  if (!verify) {
    return verify;
  }
  

  const hash = networkState.currentNetworkProfile.generationHash

    let accountDetails = walletState.currentLoggedInWallet.accounts.find(element => element.name = accountName)
    // var mosaicDuration = (1 * 365 * 24 * 60 * 4 ); // 1 year - 15 sec per block
    // var mosaicDuration;
    // if(durationType == 'month'){
    //   mosaicDuration = parseInt(duration) * 30 * 24 * 60 * 4;
    // }else{
    //   mosaicDuration = parseInt(duration) * 365 * 24 * 60 * 4;
    // }
    let publicKey = accountDetails.publicKey
    let privateKey = WalletUtils.decryptPrivateKey(walletPassword, accountDetails.encrypted, accountDetails.iv);
    let networkType = networkState.currentNetworkProfile.network.type
    const publicAccount = PublicAccount.createFromPublicKey(publicKey, networkType)
    const account = Account.createFromPrivateKey(privateKey, networkType);
    let transactionBuilder = new BuildTransactions(networkType)
   
    let mosaicDefinitionTransaction = transactionBuilder.mosaicDefinition(publicAccount,mutable,transferable,divisibility)
    

    let supp = parseFloat(supply) * Math.pow(10, divisibility);
    const mosaicSupplyChangeTransaction = transactionBuilder. buildMosaicSupplyChangeBuilder()
      .deadline(Deadline.create(environment.deadlineTransfer.deadline, environment.deadlineTransfer.chronoUnit))
      .mosaicId(mosaicDefinitionTransaction.mosaicId)
      .direction(MosaicSupplyType.Increase)
      .delta(UInt64.fromUint(supp))
      .networkType(networkType)
      .build();

    let innerTxn = [
      mosaicDefinitionTransaction.toAggregate(publicAccount),
      mosaicSupplyChangeTransaction.toAggregate(publicAccount)
    ]

    const aggregateTransaction = transactionBuilder.aggregateComplete(innerTxn)
      //.deadline(Deadline.create(environment.deadlineTransfer.deadline, environment.deadlineTransfer.chronoUnit))
      //.innerTransactions(innerTxn)
      //.networkType(networkType)
      //.build(); 

   //  transactionBuilder.fee = amountFormatterSimple(aggregateTransaction.maxFee.compact()); 
    // console.log('TF: '+transactionBuilder.fee);
    const signedTransaction = account.sign(aggregateTransaction, hash);
    const transactionHttp = new TransactionHttp(NetworkStateUtils.buildAPIEndpointURL(networkState.selectedAPIEndpoint));

    transactionHttp
      .announce(signedTransaction)
      .subscribe((x) => {
        console.log(x);
        // console.log('annoucement is made here');
        return true;
      }, err => console.error(err));

}  */

/**
 *
 *
 * @param message
 * @memberof ViewTransferComponent
 */

const calculate_fee = (message :string , amount :string, mosaic :{id :string ,amount :string}[]) :string=> {
  let mosaicsToSend = validateMosaicsToSend(amount, mosaic);
  let transactionBuilder = new BuildTransactions(networkState.currentNetworkProfile.network.type)
  if (ChainUtils.getNetworkType(networkState.currentNetworkProfile.network.type) === NetworkType.PRIVATE || ChainUtils.getNetworkType(networkState.currentNetworkProfile.network.type) === NetworkType.PRIVATE_TEST) {
    transactionBuilder.setFeeStrategy(FeeCalculationStrategy.ZeroFeeCalculationStrategy) ;
    //FeeCalculationStrategy.ZeroFeeCalculationStrategy
  }
  const x = TransferTransaction.calculateSize(PlainMessage.create(message).size(), mosaicsToSend.length);
  const b = calculateFee(x, transactionBuilder.getFeeStrategy());
  let fee;
  if (parseInt(message, 10) > 0) {
    fee = Helper.amountFormatterSimple(b.compact());
  } else if (parseInt(message, 10) === 0 && mosaicsToSend.length === 0) {
    if (transactionBuilder.getFeeStrategy() === FeeCalculationStrategy.ZeroFeeCalculationStrategy)
      fee = '0.000000';
    else {
      fee = TransferTransaction.calculateSize(parseInt(message, 10), mosaicsToSend.length) * transactionBuilder.getFeeStrategy() / 1000000;
      fee = fee.toString()
      //fee = '0.037250';
    }
  } else {
    fee = Helper.amountFormatterSimple(b.compact());
  }
  return fee;
}

/**
 *
 *
 * @returns
 * @memberof CreateTransferComponent
 */
const validateMosaicsToSend = (amountXpx :string, boxOtherMosaics :{id :string,amount :string}[]) :string[] | {id :string,amount :string}[]=> {
  const mosaics = [];

  if (amountXpx !== '' && amountXpx !== null && Number(amountXpx) !== 0) {
    // console.log(amountXpx);
    const arrAmount = amountXpx.toString().replace(/,/g, '').split('.');
    let decimal;
    let realAmount;

    if (arrAmount.length < 2) {
      decimal = addZeros(environment.mosaicXpxInfo.divisibility);
    } else {
      const arrDecimals = arrAmount[1].split('');
      decimal = addZeros(environment.mosaicXpxInfo.divisibility - arrDecimals.length, arrAmount[1]);
    }
    realAmount = `${arrAmount[0]}${decimal}`;
    mosaics.push({
      id: environment.mosaicXpxInfo.id,
      amount: realAmount
    });
  }

  boxOtherMosaics.forEach(element => {
    if (element.id !== '' && element.amount !== '' && Number(element.amount) !== 0) {
      const arrAmount = element.amount.toString().replace(/,/g, '').split('.');
      let realAmount;
      realAmount = arrAmount[0];
      mosaics.push({
        id: element.id,
        amount: realAmount
      });
    }
  });
  return mosaics;
}

/**
   *
   *
   * @param {*} cant
   * @param {string} [amount='0']
   * @returns
   * @memberof CreateTransferComponent
   */
const addZeros = (cant : number, amount :string = '0' ):string => {
  const x = '0';
  if (amount === '0') {
    for (let index = 0; index < cant - 1; index++) {
      amount += x;
    }
  } else {
    for (let index = 0; index < cant; index++) {
      amount += x;
    }
  }
  return amount;
}


export const makeTransaction = readonly({
  calculate_fee
})
