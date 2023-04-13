<template>
  <div>
    <div class='lg:w-9/12 ml-2 mr-2 lg:ml-auto lg:mr-auto mt-5 bg-white border border-white rounded-md shadow-lg'>
      <div class='mt-6 px-6 py-10 filter text-center'>
        <div class="text-md mb-3">Sirius Crosschain Swap</div>
        <div>
          <div v-if="!isChainIdValid && isWalletConnected" class="error_box error error-text">
            <div>Please select supported chain, ethereum {{  remoteNetworkType }}/ bsc {{  remoteNetworkType }}</div>
          </div>
          <div v-if="!isSupportedChainId && isWalletConnected" class="error_box error error-text">
            <div>Chain unsupported, please change to supported chain</div>
          </div>
          <div class="flex justify-center mt-10 error_box error error-text" v-if="minimumAmountNotMeet && toInputAmount">
            Minimum exchange amount: {{ minAmount }} {{ selectedToToken }}
          </div>
          <div class="flex justify-center mt-10 error_box error error-text" v-if="tokenInvalid && isWalletConnected">
            Unsupported token
          </div>
          <div class="flex justify-center mt-10 error_box error error-text" v-if="siriusTokenInvalid">
            Unsupported Sirius token
          </div>
          <div class="flex justify-center mt-10 error_box error error-text" v-if="feeInvalid">
            Price calculation error 
          </div>
          <div class="flex justify-center mt-10 error_box error error-text" v-if="!settingDone && isLoaded">
            Configuration error
          </div>
          <div class="flex justify-center mt-10 error_box error error-text" v-if="submitFailed">
            Submission failed
          </div>
          <div class="flex justify-center mt-10 error_box error error-text" v-if="customErrorMessage">
            {{ customErrorMessage }}
          </div>
          <div class="flex justify-center mt-10 success_box success success-text" v-if="isTxnSubmissionFound">
            Submission found. Please proceed to <router-link :to="{ name: 'ViewServicesStableCoinsCheckStatus' }">check status page</router-link>
          </div>
          <div class="mt-10 success_box success success-text" v-if="processing">
            <div class="mb-2">Congratulation! The swap process has already started!</div>
            <div class="font-normal relative mb-2"><b>Transaction hash: </b><a :href="explorerLink + transactionHash" target=_blank class="hover:underline">{{ transactionHash.substring(0, 7) + '...' + transactionHash.slice(-7) }} <font-awesome-icon icon="external-link-alt" class="ml-1 w-3 h-3 self-center inline-block"></font-awesome-icon></a></div>
            <div class="font-normal">Swap process may take a few hours to complete. Please save a copy of your certificate. It is needed in the event of an error.</div>
            <div><button type="button" class="w-40 hover:shadow-sm bg-blue-primary text-white text-xs hover:opacity-50 rounded font-bold px-3 py-2 border border-blue-primary outline-none mt-2 mb-2" @click="saveCertificate">{{$t('general.certificate')}}</button></div>
          </div>
          <div class="flex justify-center mt-10 success_box success success-text" v-if="dispalyWaitForConfirmationMessage">
            <div style="border-top-color:transparent" class="inline-block mr-2 relative top-2 w-4 h-4 border-4 border-green-500 border-solid rounded-full animate-spin"></div> Please wait until transaction is confirmed
          </div>
          <div class="flex justify-between">
            <div v-if="!submitMode" class="text-tsm mb-5 mt-5">Missed a swap submission ? <a @click="submitMode = !submitMode" class="hover:underline text-gray-500 hover:text-gray-800" >Retrieve remote txn hash to continue</a></div>
            <div v-else></div>
            <div v-if="isWalletConnected" class="text-xs flex items-center justify-end">
              <div v-if="connectedWalletName === 'WC'" class="flex items-center gray-text-300">
                <img src="@/modules/services/submodule/buySiriusCoins/img/icon-walletconnect.svg" class="w-4 h-4 inline-block" />&nbsp;{{ tokenType(selectedChainId) }}&nbsp;{{ connectedAddress }}
              </div>
              <div v-else class="flex items-center gray-text-300">
                <img src="@/modules/services/submodule/buySiriusCoins/img/icon-metamask-fox.svg" class="w-4 h-4 inline-block" />&nbsp;{{ tokenType(selectedChainId) }}&nbsp;{{ connectedAddress }}
              </div>
              <button @click="manualDisconnect" class="ml-2 text-gray-500 flex items-center group hover:text-gray-900 border border-gray-500 p-1 rounded-md bg-gray-50">Disconnect <font-awesome-icon icon="times" class="text-gray-500 ml-1 group-hover:text-gray-900" /></button>
            </div>
            <div v-else class="text-xs flex items-center justify-end text-gray-500 hover:text-gray-900 group duration-200 transition-all"><button @click="connectWallet" class="border border-gray-500 p-1 rounded-md bg-gray-50 hover:bg-gray-200 transition-all duration-200">Connect Wallet <font-awesome-icon icon="wallet" class="text-gray-500 ml-2 group-hover:text-gray-900" /></button></div>
            
          </div>
          <div>
            <div class="block text-left" v-if="submitMode">
              <div class="text-xs mb-2">Transaction Hash:</div>
              <div class="w-full mt-2">
                <div class="border border-gray-200 px-2 py-2 rounded-md">
                  <div class="flex gap-2">
                    <div class="flex flex-col w-full">
                      <div class="uppercase text-gray-500 font-light text-txs text-left mb-1.5">{{ remoteNetworkName }} {{ remoteNetworkType }} Transaction Hash</div>
                      <input type="text" v-model="transactionHash" @input="checkTxnValid = false"  class="w-full font-semibold text-tsm outline-none ">
                    </div>
                  </div>
                </div>
              </div>
              <button v-if="!isTxnHashVerified" class="blue-btn py-2 px-2 cursor-pointer text-center mt-2 disabled:opacity-50" :disabled="isDisabledCheckStatus" @click="checkRemoteTxn">{{ isCheckingTxn?'Checking...':'Check Remote Transaction' }}</button>
              <div v-else class="text-xs mt-2 p-2 rounded-md bg-green-100 text-green-700 inline-block">Transaction Hash is verified. Please insert <span class="font-semibold font-mono">TRANSFER TO ADDRESS</span> to continue.</div>
              <div class="inline-block text-gray-500 text-xs ml-2" v-if="!selectedChainId">Please Connect Wallet to continue</div>
              <button @click="submitMode=!submitMode; transactionHash = ''; isTxnHashVerified = false; isCheckingTxn = false; fromInputAmount= 0;" class="bg-gray-100 border-gray-300 border duration-200 transition-all hover:bg-gray-200 text-gray-600 text-xs rounded-md ml-2 py-1.5 px-2 cursor-pointer text-center mt-2">Cancel</button>
            </div>
            <BuyFormInput v-if="!submitMode" ref="buyFromComponent" formLabel="From" :tokens="stableCoins" v-model="fromInputAmount" :selectedToken="selectedFromToken" :amount="fromAmount" :tokenType="tokenType(selectedChainId)" @confirmedSelectToken="selectFromToken" />
            <BuyFormInputFlex ref="buyToComponent" formLabel="To" :tokens="siriusTokens" v-model="toInputAmount" :selectedToken="selectedToToken" :amount="toAmount" @confirmedSelectToken="selectToToken" :disabled="true" class="mt-5" />
          </div>
          <div class="flex mt-4">
            <AddressInputClean :placeholder="$t('transfer.transferPlaceholder')" v-model="siriusAddress" v-debounce:1000="checkRecipient" :showError="showAddressError" />
          </div>
          <div v-if="toggleContact" class=" border ">
          <div class='text-xxs text-left text-gray-300 font-semibold py-2 px-2 uppercase'>{{$t('general.importFromAB')}}</div>
            <div v-for="(item, number) in contacts" :key="number" class="cursor-pointer">
              <div @click="siriusAddress=item.value;toggleContact=false" class="flex justify-between">
                <div v-if="number%2==0" class="text-xs py-2 bg-gray-100 pl-2 w-full text-left">{{item.label}}</div>
                <div v-if="number%2==1" class="text-xs py-2 pl-2 w-full text-left">{{item.label}}</div>
                <div v-if="number%2==0" class="ml-auto pr-2 text-xxs py-2 font-semibold text-blue-primary bg-gray-100 uppercase">{{$t('general.select')}}</div>
                <div v-if="number%2==1" class="ml-auto mr-2 text-xxs py-2 font-semibold text-blue-primary uppercase">{{$t('general.select')}}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="md:flex md:justify-between mt-5">
          <div class="bg-blue-50 p-3 rounded-md inline-block text-xs text-right w-full">
            <div class="mb-1.5">Exchange Rate: 1 {{ selectedFromToken }} = {{ exchangeRate }} {{ selectedToToken }}</div>
            <div class="mb-1.5">Fee: {{ fee }} {{ selectedToToken }}</div>
            <div class="mb-1.5">{{ selectedFromToken }} Price: {{ selectedFromTokenPrice }} USD</div>
            <div>{{ selectedToToken }} Price: {{ selectedToTokenPrice }} USD</div>
          </div>
          <toggleSwitch v-model="isChecked" class="w-full mt-3 order-last md:order-first" />
        </div>
        <div class="flex justify-center mt-10">
          <button class="blue-btn font-semibold py-2 cursor-pointer text-center w-32 disabled:opacity-50 disabled:cursor-auto" :disabled="disabledBuy" @click="buySiriusToken">Buy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, shallowRef } from "vue";
import { useRoute } from "vue-router";
import { networkState } from "@/state/networkState";
import { ChainSwapConfig } from "@/models/stores/chainSwapConfig";
import { useI18n } from 'vue-i18n';
import { availableTokens } from '@/modules/services/submodule/buySiriusCoins/stableCoins';
import { availableToTokens } from '@/modules/services/submodule/buySiriusCoins/siriusTokens';
import { bscStableCoins } from '@/modules/services/submodule/buySiriusCoins/bscStableCoins';
import { ethStableCoins } from '@/modules/services/submodule/buySiriusCoins/ethStableCoins';
import BuyFormInput from '@/modules/services/submodule/buySiriusCoins/components/BuyFormInput.vue';
import BuyFormInputFlex from '@/modules/services/submodule/buySiriusCoins/components/BuyFormInputFlex.vue';
import AddressInputClean from "@/modules/services/submodule/buySiriusCoins/components/AddressInputClean.vue"
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import { abi, SwapUtils } from '@/util/swapUtils';
import { AppState } from "@/state/appState";
import { Address, NetworkType } from 'tsjs-xpx-chain-sdk';
import toggleSwitch from '@/modules/services/submodule/buySiriusCoins/components/toggleSwitch.vue';
import { getCurrentPriceUSD } from "@/util/functions";
import { Utilities } from "@/util/utilities";
import { Helper } from "@/util/typeHelper";


export default {
  name: "ViewServicesStableCoinsBuy",
  components: {
    BuyFormInput,
    BuyFormInputFlex,
    AddressInputClean,
    toggleSwitch,
  },
  setup(){
    const submitMode = ref(false);

    const {t} = useI18n();
    const route = useRoute();
    const qpRecipient = route.query["recipient"] || route.query["address"] || "";

    const processing = ref(false);
    const submitFailed = ref(false);
    const buyFromComponent = ref(null);
    let stableCoins = availableTokens;
    let siriusTokens = ref(availableToTokens);
    const selectedContractAddress = ref("");
    const selectedStableCoins = ref([]);
    const toAmount = ref(12345.54);
    const fromAmount = ref(12345.87);
    const fromInputAmount = ref(0);
    const toInputAmount = ref(0);
    const isSubmit = shallowRef(false);
    const tokenInvalid = ref(false);
    const siriusTokenInvalid = ref(false);
    const feeInvalid = ref(false);

    const transactionHash = ref('');
    const explorerLink = ref('');

    const checkTxnValid = ref(false);
    
    const isChainIdValid = ref(false);
    let provider;

    const disabledBuy = computed(() => {

      if(submitMode.value){
        return siriusTokenInvalid.value 
          || !settingDone.value 
          || !isChainIdValid.value 
          || !isSupportedChainId.value 
          || showAddressError.value 
          || !isChecked.value 
          || fromInputAmount.value == 0 
          || toInputAmount.value <= 0
          || isSubmit.value
          || feeInvalid.value
          || transactionHash.value.trim() == ""
          || !checkTxnValid.value
      }

      return tokenInvalid.value
        || siriusTokenInvalid.value 
        || !settingDone.value 
        || !isChainIdValid.value 
        || !isSupportedChainId.value 
        || fromInputAmount.value < 1 
        || showAddressError.value 
        || !isChecked.value 
        || isSubmit.value
        || feeInvalid.value
        || minimumAmountNotMeet.value
    });

    const isTxnSubmissionFound = ref(false);
    const customErrorMessage = ref("");
    const dispalyWaitForConfirmationMessage = ref(false);
    const selectedRemoteSinkAddress = ref("");
    const bscSinkAddress = ref("");
    const ethSinkAddress = ref("");
    const isSupportedChainId = ref(false);
    const bscDisabled = ref(true);
    const ethDisabled = ref(true);
    const connectedAddress = ref("");
    const selectedFromToken = ref('USDT');
    const selectedToToken = ref('XPX');
    const priceUpdated = ref(false);
    const settingDone = ref(false);
    const isLoaded = ref(false);

    const BASE_BYTE_SIZE = 337;
    let FEE_PER_BYTE = 0;
    let ADDITIONAL_COSIGNERS = 0;
    let FEE_MULTIPLIER = 0;
    let NATIVE_FEE_TOKEN_NAME = "";

    const selectedFromTokenPrice = computed(()=>{
      priceUpdated.value; // just to trigger auto recompute

      let token = stableCoins.find(x => x.name === selectedFromToken.value); 

      return token && token.priceUpdated ? token.price: 0;
    });

    const selectedToTokenPrice = computed(()=>{
      priceUpdated.value; // just to trigger auto recompute

      let token = siriusTokens.value.find(x => x.name === selectedToToken.value); 

      return token && token.priceUpdated ? token.price: 0;
    });

    const selectedToTokenDecimals = computed(()=>{
      let token = siriusTokens.value.find(x => x.name.toLowerCase() === selectedToToken.value.toLowerCase());

      return token ? token.divisibility : 0;
    });

    const nativeFee = computed(()=>{
      settingDone.value;
      return Helper.safeMultiply(BASE_BYTE_SIZE + (ADDITIONAL_COSIGNERS * 96) + exchangeRate.value.toString().length, FEE_PER_BYTE);
    });

    const minAmount = computed(()=>{
      return Helper.safeMultiplyCeilDecimals(fee.value, 1.2, selectedToTokenDecimals.value);
    });

    const nativeTokenPrice = computed(()=>{
      if(!settingDone.value || !priceUpdated.value){
        return 0;
      }
      
      let token = siriusTokens.value.find(x => x.name.toLowerCase() === NATIVE_FEE_TOKEN_NAME.toLowerCase());
      
      return token && token.priceUpdated ? token.price : 0;
    });

    const fee = computed(()=>{

      if(!settingDone.value){
        return 0;
      }

      let feeAmount = FEE_MULTIPLIER ?
          Helper.safeMultiply(nativeFee.value, FEE_MULTIPLIER) : nativeFee.value;

      if(selectedToToken.value.toLowerCase() !== NATIVE_FEE_TOKEN_NAME.toLowerCase()){

        let totalFeeInUSD = Helper.safeMultiply(nativeTokenPrice.value, nativeFee.value);
        feeAmount = Helper.safeDivideCeilDecimals(totalFeeInUSD, selectedToTokenPrice.value, selectedToTokenDecimals.value);
      }

      return feeAmount;
    });

    const exchangeRate = computed(()=>{
      return Helper.safeDivideFloorDecimals(selectedFromTokenPrice.value, selectedToTokenPrice.value, selectedToTokenDecimals.value);
    });

    const selectFromToken = (token) => {
      selectedFromToken.value = token;
      updateBuyFromTokenBalance();
    }
    const selectToToken = (token) => {
      selectedToToken.value = token;
    }

    const tokenType = (chainId)=>{

      let tokenType = "";

      if(chainId === bscChainId.value){
        tokenType = "(BEP20)";
      }
      else if(chainId === ethereumChainId.value){
        tokenType = "(ERC20)";
      }

      return tokenType;
    }

    const updateBuyFromTokenBalance = ()=>{
      if(!submitMode.value){
        buyFromComponent.value.updateSeletectedTokenBalance(selectedFromToken.value);
      } 
    }

    // connect wallet section
    const ethereumChainId = ref(0);
    const bscChainId = ref(0);
    const remoteNetworkType = computed(()=> ethereumChainId.value === 1 ? "mainnet": "testnet");
    const remoteNetworkName = computed(()=>{
      if(selectedChainId.value === ethereumChainId.value){
        return "ETH"
      }else if(selectedChainId.value === bscChainId.value){
        return "BSC";
      }
      else{
        return "BSC / ETH";
      }
    });
    const selectedChainId = ref(0);
    const isWalletConnected = ref(false);
    const connectedWalletName = ref("");

    const web3Modal = new Web3Modal({ cacheProvider: false, providerOptions:{
      // mewconnect: {
      //   package: MewConnect, // required
      //   options: {
      //     infuraId: "27e484dcd9e3efcfd25a83a78777cdf1" // required
      //   }
      // },
      // binancechainwallet: {
      //   package: true
      // },
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: "27e484dcd9e3efcfd25a83a78777cdf1",
          rpc:{
            1: "https://eth-rpc.gateway.pokt.network/",
            56: "https://bsc-dataseed1.binance.org/"
          }
        }
      }
    }});

    const resetStableCoinsBalanceZero = ()=>{
      fromInputAmount.value = 0;
      for(let i =0; i < stableCoins.length ;++i){
        stableCoins[i].balance = 0;
      }
      selectedStableCoins.value = [];
      updateBuyFromTokenBalance();
    }

    const checkValidSelectedChainId = ()=>{
      if(selectedChainId.value === ethereumChainId.value || selectedChainId.value === bscChainId.value){
        isChainIdValid.value = true;

        if(selectedChainId.value === ethereumChainId.value){
          selectedRemoteSinkAddress.value = ethSinkAddress.value;
        }
        else{
          selectedRemoteSinkAddress.value = bscSinkAddress.value;
        }
      }
      else{
        isChainIdValid.value = false;
      }

      return isChainIdValid.value;
    }

    const checkChainSupported = ()=>{
      if(selectedChainId.value === ethereumChainId.value){
        isSupportedChainId.value = !ethDisabled.value;
      }
      else if(selectedChainId.value === bscChainId.value){
        isSupportedChainId.value = !bscDisabled.value;
      }

      return isSupportedChainId.value;
    }

    const searchAccountStableCoinsBalance = async()=>{

      let contracts = [];
      
      if(selectedChainId.value === ethereumChainId.value){
        contracts = ethStableCoins;
      }
      else if(selectedChainId.value === bscChainId.value){
        contracts = bscStableCoins;
      }
      else{
        resetStableCoinsBalanceZero();
        return;
      }

      selectedStableCoins.value = contracts;

      let promises = [];
      const web3Provider = new ethers.providers.Web3Provider(provider);
      const signer = web3Provider.getSigner();
      const address = await signer.getAddress();

      for(let i=0; i < contracts.length; ++i){
        // console.log(contracts[i].disabled);
        if(contracts[i].disabled){
          continue;
        }

        const contract = new ethers.Contract(contracts[i].contractAddress, abi, web3Provider);
        const decimals= contracts[i].decimals;
        const currentName = contracts[i].name;

        let newPromise = new Promise(async(resolve, reject)=>{
          const balance = await contract.balanceOf(address);

          const balanceString = balance.toString();
          const fixedBalance = parseFloat(balanceString.length > decimals ? balanceString.slice(0, -decimals) + '.'+ balanceString.slice(-decimals) : '0.' + '0'.repeat(decimals - balanceString.length) + balanceString);
          let stableCoin = stableCoins.find(x => x.name === contracts[i].name);
          if(selectedFromToken.value === currentName && fromInputAmount.value > fixedBalance){
            fromInputAmount.value = fixedBalance;
          }
          stableCoin.balance = fixedBalance;
          
          resolve(true);
        });
        promises.push(newPromise);
      }

      return Promise.all(promises).then((values)=>{
        updateBuyFromTokenBalance();
        console.log("Stable coins balance updated");
      })
    }

    const checkSelectedToTokenSupported = ()=>{
      let siriusToken = siriusTokens.value.find(x => x.name.toLowerCase() === selectedToToken.value.toLowerCase());

      if(siriusToken){

        if(siriusToken.disabled){
          siriusTokenInvalid.value = true;
        }
        else{
          siriusTokenInvalid.value = false;
        }
      }
      else{
        siriusTokenInvalid.value = true;
      }
    }

    const checkSelectedTokenSupported = ()=>{
      if(selectedChainId.value === ethereumChainId.value){
        tokenInvalid.value = ethStableCoins.find(x => x.name === selectedFromToken.value).disabled;
      }
      else if(selectedChainId.value === bscChainId.value){
        tokenInvalid.value = bscStableCoins.find(x => x.name === selectedFromToken.value).disabled;
      }
      else{
        
        tokenInvalid.value = true;
      }
    }

    const updateSelectedContractAddress = ()=>{
      if(selectedStableCoins.value.length){
        selectedContractAddress.value = selectedStableCoins.value.find(x => x.name === selectedFromToken.value).contractAddress;
      }
    }

    const fetchServiceInfo = async()=>{
      try{
        const serviceInfo = await SwapUtils.fetchAllSwapServiceInfo(swapData.swap_IN_SERVICE_URL);
        bscSinkAddress.value = serviceInfo.data.bscInfo.sinkAddress;
        ethSinkAddress.value = serviceInfo.data.ethInfo.sinkAddress;

        if(bscSinkAddress.value !== "0x0000000000000000000000000000000000000000"){
          bscDisabled.value = false;
        }

        if(ethSinkAddress.value !== "0x0000000000000000000000000000000000000000"){
          ethDisabled.value = false;
        }

        FEE_PER_BYTE = serviceInfo.data.feeInfo.feePerByte;
        ADDITIONAL_COSIGNERS = serviceInfo.data.feeInfo.cosigners;
        FEE_MULTIPLIER = serviceInfo.data.feeInfo.multiplier ? serviceInfo.data.feeInfo.multiplier : 0;
        NATIVE_FEE_TOKEN_NAME = serviceInfo.data.feeInfo.tokenName;

        const siriusTokensInfo = serviceInfo.data.siriusToken;

        for(let siriusToken of siriusTokens.value){

          let currentSiriusToken = siriusTokensInfo.find(x => x.name.toUpperCase() == siriusToken.name.toUpperCase()); 

          if(!currentSiriusToken){
            siriusToken.disabled = true;
          }
        }

        for(let bscStableCoin of bscStableCoins){
          bscStableCoin.disabled = true;
        }

        for(let ethStableCoin of ethStableCoins){
          ethStableCoin.disabled = true;
        }

        const bscTokensInfo = serviceInfo.data.bscScAddressInfo;

        for(let bscScAddress of bscTokensInfo){

          let currentBscStableCoin = bscStableCoins.find(x => x.name == bscScAddress.name); 

          if(currentBscStableCoin){
            currentBscStableCoin.disabled = false;
            currentBscStableCoin.contractAddress = bscScAddress.contractAddress;
            currentBscStableCoin.decimals = bscScAddress.decimals;
          }
        }

        const ethTokensInfo = serviceInfo.data.ethScAddressInfo;

        for(let ethScAddress of ethTokensInfo){

          let currentEthStableCoin = ethStableCoins.find(x => x.name == ethScAddress.name); 

          if(currentEthStableCoin){
            currentEthStableCoin.disabled = false;
            currentEthStableCoin.contractAddress = ethScAddress.contractAddress;
            currentEthStableCoin.decimals = ethScAddress.decimals;
          }
        }
        isLoaded.value = true;
        settingDone.value = true;
      }
      catch(error){
        console.log(error);
        isLoaded.value = true;
        settingDone.value = false;
      }
    }

    const getCurrentPrice = async ()=>{

      let prices = await getCurrentPriceUSD(SwapUtils.checkSwapPrice(swapData.priceConsultURL));

      for(let siriusToken of siriusTokens.value){

        if(prices[siriusToken.name.toLowerCase()]){
          siriusToken.price = prices[siriusToken.name.toLowerCase()];
          siriusToken.priceUpdated = true;
        }
        else{
          siriusToken.priceUpdated = false;
        }
      }

      for(let stableCoin of stableCoins){

        if(prices[stableCoin.name.toLowerCase()]){
          stableCoin.price = prices[stableCoin.name.toLowerCase()];
          stableCoin.priceUpdated = true;
        }
        else{
          stableCoin.priceUpdated = false;
        }
      }

      priceUpdated.value = true;
    };

    const setDisconnected = ()=>{  
      provider = null;
      isWalletConnected.value = false;
      connectedWalletName.value = "";
      connectedAddress.value = "";
      selectedChainId.value = 0;
    }

    // events handler
    const handleAccountsChanged = (accounts) => {
      if(accounts[0]){
        connectedAddress.value = accounts[0].substr(0, 5) + '...' + accounts[0].substr(-5);
      }
      else{
        disconnectWallet();
        setDisconnected();
      }
    };

    const handleChainChanged = (chainId) => {

      if(typeof chainId === "string"){
        selectedChainId.value = parseInt(chainId, 16);
      }
      else{
        selectedChainId.value = chainId;
      }
    }

    const handleWCDisconnect = (code, reason) => {
      // console.log(code, reason);
      disconnectWallet(true);
      setDisconnected();
    };

    const handleDisconnect = (error) => {
      // console.log(error);
      // console.log("Call disconnect");
      // disconnectWallet(true);
      // setDisconnected();

      // MetaMask never send disconnect event when all permission removed
      // it trigger when changing to external chain, then trigger connect again 
    };

    const handleConnect = (connectData)=>{
      // MetaMask call after change to external chain
      handleChainChanged(connectData.chainId);
    }

    // event handler end

    const removeListener = ()=>{
      if(provider){
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("chainChanged", handleChainChanged);
        provider.removeListener("connect", handleConnect);
        
        if(connectedWalletName.value === "WC"){
          provider.removeListener("disconnect", handleWCDisconnect);
        }
        else{
          provider.removeListener("disconnect", handleDisconnect);
        }
      }
    }

    const connectWallet = async() =>{
      try {
          provider = await (connectedWalletName.value === "WC" ? web3Modal.connectTo("walletconnect") : web3Modal.connect());
          // console.log(provider);

          isWalletConnected.value = true;

          provider.on("accountsChanged", handleAccountsChanged);

          // Subscribe to chainId change, working on wc
          provider.on("chainChanged", handleChainChanged);

          provider.on("connect", handleConnect);

          // check if it is walletconnect
          if(provider.wc){
            selectedChainId.value = provider.chainId;
            connectedAddress.value = provider.accounts[0].substr(0, 5) + '...' + provider.accounts[0].substr(-5);
            connectedWalletName.value = "WC";
            // wc disconnect event
            // Subscribe to session disconnection
            provider.on("disconnect", handleWCDisconnect);
          }
          else{
            // only for MetaMask Extension
            selectedChainId.value = parseInt(provider.chainId, 16);
            connectedAddress.value = provider.selectedAddress.substr(0, 5) + '...' + provider.selectedAddress.substr(-5);
            connectedWalletName.value = "MM";

            // Subscribe to provider disconnection
            provider.on("disconnect", handleDisconnect);
          }

          explorerLink.value = selectedChainId.value === bscChainId.value ? swapData.BSCScanUrl : swapData.ETHScanUrl;
      }catch(error){
        // console.log("Error");
        // console.log(error);
      }
    }

    const disconnectWallet = (fromEvent = false)=>{

      if(!fromEvent){
        manualDisconnect();
      }
      else{
        isWalletConnected.value = false;
        connectedWalletName.value = "";
      }
    }

    const manualDisconnect = ()=>{

      if(provider && provider.disconnect){
        console.log("Do disconnect");
        provider.disconnect();
      }
      else if(provider){
        removeListener();
      }

      isWalletConnected.value = false;
      connectedWalletName.value = "";
      setDisconnected()
      resetStableCoinsBalanceZero();
    }

    const checkWalletConnected = ()=>{
      let walletConnectData = localStorage.getItem("walletconnect");

      if(walletConnectData !== null){
        isWalletConnected.value = true;
        connectedWalletName.value = "WC";
        connectWallet();
      }
    }

    checkWalletConnected();

    const swapTimestamp = ref('');

    const checkRemoteTxn = async() =>{
      isCheckingTxn.value = true;
      customErrorMessage.value = "";
      isTxnSubmissionFound.value = false;
      checkTxnValid.value = false; 
      try {
        transactionHash.value = transactionHash.value.trim();

        if(transactionHash.value === ""){
          customErrorMessage.value = "Please fill in transaction hash";
          isCheckingTxn.value = false;
          return;
        }
        
        if(!provider){
          customErrorMessage.value = "Please connect wallet";
          isCheckingTxn.value = false;
          return;
        }

        let url = '';
        if(remoteNetworkName.value == 'BSC'){
          url = SwapUtils.getIncoming_BSCBuySiriusTokenCheckRemoteStatus_URL(swapData.swap_IN_SERVICE_URL, 'bsc', transactionHash.value);
        }
        else if(remoteNetworkName.value == 'ETH'){
          url = SwapUtils.getIncoming_BSCBuySiriusTokenCheckRemoteStatus_URL(swapData.swap_IN_SERVICE_URL, 'eth', transactionHash.value);
        }
        else{
          customErrorMessage.value = "Please select supported network at wallet";
          isCheckingTxn.value = false;
          return;
        }
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if(response.status == 200){
          isTxnSubmissionFound.value = true;
          isCheckingTxn.value = false;
          return;
        }

        const web3Provider = new ethers.providers.Web3Provider(provider);

        let transactionReceipt = await web3Provider.getTransactionReceipt(transactionHash.value);

        if(transactionReceipt && selectedChainId.value === bscChainId.value){

          const bscCoin = bscStableCoins.find(x => x.contractAddress.toLowerCase() == transactionReceipt.to.toLowerCase()); 

          if(bscCoin && !bscCoin.disabled){
            selectedFromToken.value = bscCoin.name;
            fromInputAmount.value = Helper.safeDivide(Helper.bigNumberFromString(transactionReceipt.logs[0].data), Math.pow(10, bscCoin.decimals));
            selectedContractAddress.value = bscCoin.contractAddress;
            isTxnHashVerified.value = true;
          }
          else{
            customErrorMessage.value = "Invalid BSC token";
            isCheckingTxn.value = false;
            return false;
          }
        }
        else if(transactionReceipt && selectedChainId.value === ethereumChainId.value){
          const ethCoin = ethStableCoins.find(x => x.contractAddress.toLowerCase() == transactionReceipt.to.toLowerCase()); 

          if(ethCoin && !ethCoin.disabled){
            selectedFromToken.value = ethCoin.name;
            fromInputAmount.value = Helper.safeDivide(Helper.bigNumberFromString(transactionReceipt.logs[0].data), Math.pow(10, ethCoin.decimals));
            selectedContractAddress.value = ethCoin.contractAddress;
            isTxnHashVerified.value = true;
          }
          else{
            customErrorMessage.value = "Invalid ETH token";
            isCheckingTxn.value = false;
            return false;
          }
        }
        else{
          customErrorMessage.value = "Remote transaction not found/ invalid";
          return false;
        }

        let transactionStatus = await web3Provider.getTransaction(transactionHash.value);
        
        if(transactionReceipt && transactionReceipt.status === 1){ // when transaciton is confirmed but status is 1

            if(transactionStatus.to.toLowerCase() !== selectedContractAddress.value.toLowerCase() 
              || transactionReceipt.logs.length !== 1 || 
              transactionReceipt.logs[0].topics[0] !== "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
              || transactionReceipt.logs[0].topics[2] !== "0x" + "0".repeat(66 - selectedRemoteSinkAddress.value.length) + selectedRemoteSinkAddress.value.substring(2).toLowerCase()){
                customErrorMessage.value = "Remote transaction invalid";
                return false;
            }
          
        }else if(transactionReceipt && transactionReceipt.status === 0){ // transaction is confirmed but status is 0 - fee too low
          customErrorMessage.value = "Remote transaction failed";
          return false;
        }else if(!transactionReceipt && !transactionStatus){ // transaction hash is not found
          customErrorMessage.value = "Remote transaction not found";
          return false;
        }else{
          customErrorMessage.value = "Remote transaction unknown status";
          return false;
        }
        
      }catch(error){
        console.log(error);
        customErrorMessage.value = "Transaction checking failed";
      }

      checkTxnValid.value = true;
    }

    const doResubmission = async()=>{
      try {
        isSubmit.value = true;
        const web3Provider = new ethers.providers.Web3Provider(provider);
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();

        let signedMessageSignature;

        if (provider.wc) {
          signedMessageSignature = await provider.send(
              'personal_sign',
              [ ethers.utils.hexlify(ethers.utils.toUtf8Bytes(siriusAddress.value)), address.toLowerCase() ]
          );
        }
        else { 
          signedMessageSignature = await signer.signMessage(siriusAddress.value);
        }

        let txnHash = transactionHash.value;

        const data = {
          fromToken: selectedFromToken.value,
          toToken: selectedToToken.value,
          recipient: siriusAddress.value,
          signature: signedMessageSignature,
          txnInfo: {
            txnHash: txnHash,
            network: selectedChainId.value === bscChainId.value ? "BSC" : "ETH"
          }
        };

        const response = await fetch(SwapUtils.getIncoming_SwapTransfer_URL(swapData.swap_IN_SERVICE_URL), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if(response.status == 200 || response.status == 201 || response.status == 202){
          const serverResponseData = await response.json();

          console.log(serverResponseData);
          swapTimestamp.value = Helper.IsoTimeRemoveFormat(serverResponseData.timestamp);

          processing.value = true;
        }
        else{
          submitFailed.value = true;
        }
        
      }catch(error){
        isSubmit.value = false;
      }
    }

    const buySiriusToken = async ()=>{

      customErrorMessage.value = "";
      isTxnSubmissionFound.value = false;
      checkRecipient();

      if(submitMode.value){
        doResubmission();
        return;
      }

      try {
        isSubmit.value = true;
        const web3Provider = new ethers.providers.Web3Provider(provider);
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();

        let signedMessageSignature;

        if (provider.wc) {
          signedMessageSignature = await provider.send(
              'personal_sign',
              [ ethers.utils.hexlify(ethers.utils.toUtf8Bytes(siriusAddress.value)), address.toLowerCase() ]
          );
        }
        else { 
          signedMessageSignature = await signer.signMessage(siriusAddress.value);
        }

        const contract = new ethers.Contract(selectedContractAddress.value, abi, signer);

        const decimals = selectedStableCoins.value.find(x => x.contractAddress === selectedContractAddress.value).decimals;

        /* for future references
        let ABI = [
        "function transfer(address to, uint amount)"
        ];
        let iface = new ethers.utils.Interface(ABI);
        let dataPayload = iface.encodeFunctionData("transfer", [ address, ethers.utils.parseUnits(fromInputAmount.value.toString(), decimals) ])

        console.log(dataPayload);
        
        const tx = {
          // this could be provider.addresses[0] if it exists
          from: address, 
          // target address, this could be a smart contract address
          to: selectedContractAddress.value, 
          // optional if you want to specify the gas limit 
          gasLimit: 57500, 
          // optional if you are invoking say a payable function 
          value: "0x00",
          // this encodes the ABI of the method and the arguements
          data: dataPayload
        };

        let receipt = await signer.sendTransaction(tx);

        console.log(receipt);
        */

        let options = {
          gasLimit: 57500,
        };
        const receipt = await contract.transfer(
          selectedRemoteSinkAddress.value,
          ethers.utils.parseUnits(fromInputAmount.value.toString(), decimals)
          //options,
        );

        dispalyWaitForConfirmationMessage.value = true;

        let loop = 1;
        let receiptFound = false;

        while(loop <= 15 && !receiptFound){
          await Utilities.delay(2000);

          let txnReceipt = await web3Provider.getTransactionReceipt(receipt.hash);
          
          if(txnReceipt){
            receiptFound = true;
            // console.log(txnReceipt);
          }
          ++loop;
        }

        dispalyWaitForConfirmationMessage.value = false;

        if(!receiptFound){
          customErrorMessage.value = "Transaction not confirmed";
          throw "Transaction not confirmed";
        }

        let txnHash = receipt.hash;
        let nonce = receipt.nonce;
        transactionHash.value = txnHash;

        const data = {
          fromToken: selectedFromToken.value,
          toToken: selectedToToken.value,
          nonce: nonce,
          recipient: siriusAddress.value,
          signature: signedMessageSignature,
          txnInfo: {
            txnHash: txnHash,
            network: selectedChainId.value === bscChainId.value ? "BSC" : "ETH"
          }
        };

        const response = await fetch(SwapUtils.getIncoming_SwapTransfer_URL(swapData.swap_IN_SERVICE_URL), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if(response.status == 200 || response.status == 201 || response.status == 202){
          const serverResponseData = await response.json();

          console.log(serverResponseData);
          swapTimestamp.value = Helper.IsoTimeRemoveFormat(serverResponseData.timestamp);

          processing.value = true;
          searchAccountStableCoinsBalance();
        }
        else{
          submitFailed.value = true;
        }

      } catch (error) {
        isSubmit.value = false;
        console.log(error);
      }
    }

    // section end

    const showAddressError = shallowRef(true);
    const toggleContact = shallowRef(false);
    const siriusAddress = ref(qpRecipient);
    const minimumAmountNotMeet = ref(false);

    const checkRecipient = () =>{
      try {
        let recipientAddress = Helper.createAddress(siriusAddress.value);
        siriusAddress.value = recipientAddress.pretty();
        let networkOk = Helper.checkAddressNetwork(recipientAddress, AppState.networkType);
        if(!networkOk){
          showAddressError.value = true;
        }
        else{
          showAddressError.value = false;
        }
      } catch (error) {
        showAddressError.value = true;
      }
    };
    checkRecipient();

    // watcher section
    watch([fromInputAmount, exchangeRate], (newValue)=>{
      toInputAmount.value = Helper.safeMultiplyFloorDecimals(newValue[0], newValue[1], selectedToTokenDecimals.value);

      minimumAmountNotMeet.value = toInputAmount.value < minAmount.value ? true : false;
    });

    watch(selectedFromToken, (newValue)=>{
      updateSelectedContractAddress();
      checkSelectedTokenSupported();
    });

    watch(selectedToToken, (newValue)=>{
      checkSelectedToTokenSupported();
    });

    watch([selectedChainId, connectedAddress], (newChainId)=>{

      let isValid = checkValidSelectedChainId();
      let isSupported = checkChainSupported();

      if(isValid && isSupported){
        searchAccountStableCoinsBalance();
        updateSelectedContractAddress();
        checkSelectedTokenSupported();
      }
    })

    watch(fee, (newFee)=>{
      
      if(!priceUpdated.value){
        feeInvalid.value = false;
      }
      else if(nativeTokenPrice.value && selectedToTokenPrice.value && selectedFromTokenPrice.value){
        feeInvalid.value = false;
      }
      else{
        feeInvalid.value = true;
      }
    });

    const isChecked = ref(false);

    const saveCertificate = () => {
      const swapQr = SwapUtils.generateQRCode(explorerLink.value + transactionHash.value);
      SwapUtils.generateIncomingPdfCert(selectedChainId.value === bscChainId.value ? "BSC" : "ETH", swapTimestamp.value, siriusAddress.value, selectedFromToken.value, transactionHash.value, swapQr);
    };

    let swapData;
    // const initDone = ref(false);

    const init = async() =>{
      swapData= new ChainSwapConfig(networkState.chainNetworkName);
      swapData.init();
      ethereumChainId.value = networkState.currentNetworkProfile.network.type === NetworkType.MAIN_NET ? 1 : 5;
      bscChainId.value = networkState.currentNetworkProfile.network.type === NetworkType.MAIN_NET ? 56: 97;
      explorerLink.value = selectedChainId.value === bscChainId.value ? swapData.BSCScanUrl : swapData.ETHScanUrl;
      getCurrentPrice();
      fetchServiceInfo();
      // initDone.value = true;
    }
    
    if(AppState.isReady){
      init();
    }else{
      let readyWatcher = watch(AppState, (value) => {
        if(value.isReady){
          init();
          readyWatcher();
        }
      });
    }

    const isCheckingTxn = shallowRef(false);
    const isTxnHashVerified = shallowRef(false);

    const isDisabledCheckStatus = computed(() => {
      if(isCheckingTxn.value){
        return true;
      }
      if(selectedChainId.value === bscChainId.value){
        // check for BSC txn type
        if(transactionHash.value.length == 66){
          if(transactionHash.value.substring(0, 2).toUpperCase() == '0X'){
            return false
          }
          return true;
        }else{
          return true;
        }
      }else{
        return true;
      }
    });

    return {
      isCheckingTxn,
      isTxnHashVerified,
      isLoaded,
      stableCoins,
      siriusTokens,
      toAmount,
      fromAmount,
      fromInputAmount,
      toInputAmount,
      selectedFromToken,
      selectedToToken,
      selectFromToken,
      selectToToken,
      disabledBuy,
      connectedAddress,
      availableTokens,
      manualDisconnect,
      connectWallet,
      isWalletConnected,
      connectedWalletName,
      tokenType,
      selectedChainId,
      buyFromComponent,
      exchangeRate,
      isChainIdValid,
      selectedFromTokenPrice,
      selectedToTokenPrice,
      buySiriusToken,
      showAddressError,
      toggleContact,
      siriusAddress,
      checkRecipient,
      // contacts,
      isChecked,
      isSubmit,
      isSupportedChainId,
      remoteNetworkType,
      remoteNetworkName,
      settingDone,
      tokenInvalid,
      siriusTokenInvalid,
      processing,
      submitFailed,
      fee,
      dispalyWaitForConfirmationMessage,
      customErrorMessage,
      isTxnSubmissionFound,
      explorerLink,
      transactionHash,
      saveCertificate,
      nativeTokenPrice,
      feeInvalid,
      minimumAmountNotMeet,
      minAmount,
      submitMode,
      checkRemoteTxn,
      checkTxnValid,
      isDisabledCheckStatus,
    }
  }
}
</script>
