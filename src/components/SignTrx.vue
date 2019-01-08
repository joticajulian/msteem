<template>
  <div>
    <div class="container">
      <form>
        <h1>Sign transaction</h1>
        <h3>Paste your operation or transaction here</h3>
        <div class="form-group">
          <textarea class="form-control" id="textareaTrx" rows="15" v-model="inputTrx"></textarea>
        </div>
        <div v-if="needHeaders" class="form-group">
          <button class="btn btn-primary" @click="addHeaders">Add Headers</button>
        </div>
        <div class="form-row align-items-center">
          <div class="col-12 col-md-2">
            <label for="password" class="">Private key</label>
          </div>
          <div class="col-12 col-md-8">
            <input type="password" id="password" placeholder="key" class="form-control" v-model="password"/>
          </div>
          <div class="col-12 col-md-2">
            <button class="btn btn-primary col-12" @click="sign">Sign</button>
          </div>
        </div>
      </form>
      <div v-if="!needSignatures" class="row mt-5 mb-3">
        <button class="btn btn-success btn-lg" @click="broadcastTrx">Broadcast Transaction</button>
      </div>
      <div class="row mt-3">
       <div v-if="success" class="alert alert-success col-12">{{successMsg}}</div>
       <div v-if="error" class="alert alert-danger col-12">{{errorMsg}}</div>
      </div>      
    </div>
  </div>
</template>

<script>
import { Client, PrivateKey } from 'dsteem'
import debounce from "lodash.debounce";

import Config from "@/config.js";
import Utils from "@/utils.js";

export default {
  name: "SignTrx",
  
  data() {
    return {
      inputTrx: '',
      password: '',
      needHeaders: false,
      needSignatures: true,
      
      error: false,
      errorMsg: '',
      success: false,
      successMsg: ''      
      
    };
  },
  
  created() {
    this.debounced_validateTrx = debounce(this.validateTrx, 300);    
  },
  
  mounted() {
    this.startEventListenerFile();
  },
  
  watch: {
    inputTrx: function() {
      this.debounced_validateTrx();
    }    
  },
  methods: {
    broadcastTrx () {
      var trx
      
      try {
        trx = JSON.parse(this.inputTrx)
        this.hideError()        
      } catch (error) {
        this.showError('Transaction: '+error.message)
        console.log(error)
        return
      }
      
      var client = new Client(Config.RPC_NODE.url)
      
      let self = this
      client.broadcast.send(trx).then(function(response){
        console.log(response)
        self.showSuccess('Transaction sent successfully! \n https://joticajulian.github.io/steemexplorer/#/b/' + response.block_num + '/' + response.id)
      })
      .catch(function(error){
        console.log(error)
        self.showError('Error: ' + JSON.stringify(error))
      });    
    },
  
    sign () {
      var trx
      
      try {
        trx = JSON.parse(this.inputTrx)
        this.hideError()        
      } catch (error) {
        this.showError('Transaction: '+error.message)
        console.log(error)
        return
      }      
      
      try {
        var privKey = PrivateKey.fromString(this.password);
        this.hideError()
      } catch (error) {
        this.showError('Incorrect private key: '+error.message)
        console.log(error)
        return
      }

      try {
        var client = new Client(Config.RPC_NODE.url)
        var sgnTrx = client.broadcast.sign(trx , privKey);
        this.hideError()
      } catch (error) {
        this.showError('Incorrect transaction: '+error.message)
        console.log(error)
        return
      }
      
      this.inputTrx = JSON.stringify(sgnTrx,null,2)
      this.showSuccess('The signature has been added')
    },
    
    async addHeaders () {
      var op
      try {
        op = JSON.parse(this.inputTrx)
        this.hideError()        
      } catch (error) {
        this.showError('Operation: '+error.message)
        console.log(error)
        return
      }
      
      var client = new Client(Config.RPC_NODE.url)
      
      const dgp = await client.database.getDynamicGlobalProperties()
      
      var head_block_number = dgp.head_block_number;
      var head_block_id = dgp.head_block_id;
      var prefix = Buffer.from(head_block_id, 'hex').readUInt32LE(4);
         
      var expireTime = 3590 * 1000;
      var expiration = new Date(Date.now() + expireTime).toISOString().slice(0, -5)
      
      var trx = {
        ref_block_num: head_block_number,
        ref_block_prefix: prefix,
        expiration: expiration,
        operations: [op],
        extensions: []            
      }
      
      this.inputTrx = JSON.stringify(trx,null,2)
    },
    
    validateTrx () {
      var jsonTrx
      
      try {
        jsonTrx = JSON.parse(this.inputTrx)
        this.hideError()
      } catch (error) {
        this.showError('Transaction: '+error.message)
        console.log(error)
        return
      }
      
      if(Array.isArray(jsonTrx)){
        // is an Operation
        this.needHeaders = true;
        return
      }
      
      if(jsonTrx.ref_block_num && jsonTrx.ref_block_prefix &&
        jsonTrx.expiration && jsonTrx.operations && jsonTrx.extensions
      )
      {
        // is a Transaction
        this.needHeaders = false;
        
        if(jsonTrx.signatures && jsonTrx.signatures.length > 0) {
          this.needSignatures = false;
        } else {
          this.needSignatures = true;
        }
        return
      }
      console.log('Unknown type of transaction')
      this.showError('Unknown type of transaction')      
    },
    
    showError (msg) {
      this.error = true
      this.errorMsg = msg
      this.hideSuccess()
    },
    
    hideError () {
      this.error = false
      this.errorMsg = ''
    },
    
    showSuccess (msg) {
      this.success = true
      this.successMsg = msg
      this.hideError()
    },
    
    hideSuccess () {
      this.success = false
      this.successMsg = ''
    }
  }
};
</script>

<style scoped>

#textareaTrx{
  font-family: monospace;
  font-size: 0.8rem;
}

</style>
