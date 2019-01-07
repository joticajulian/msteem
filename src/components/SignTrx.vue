<template>
  <div>
    <div class="container">    
      <form>
        <div class="form-group">
          <label for="textareaTrx">Transaction</label>
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
            <input type="password" id="password" placeholder="key or wif" class="form-control" v-model="password"/>
          </div>
          <div class="col-12 col-md-2">
            <button class="btn btn-primary col-12" @click="sign">Sign</button>
          </div>
        </div>
      </form>
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
      
      error: false,
      errorMsg: '',
      success: false,
      successMsg: ''      
      
    };
  },
  
  created() {
    this.debounced_validateTrx = debounce(this.validateTrx, 300);
    
    // test - delete    
    var head_block_number = 29135172; 
    var head_block_id = "01bc914470166bb1e3b822849a0a8a895aa2bebc"     
    var prefix = Buffer.from(head_block_id, 'hex')
    console.log(prefix)
    var prefix2 = prefix.readUInt32LE(4);
    console.log("prefix2: "+prefix2);
    // end test    
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
    sign () {
      var trx
      console.log('input trx:')
      console.log(this.inputTrx)
      
      try {
        trx = JSON.parse(this.inputTrx)
        this.hideError()
        console.log(trx)
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
        console.log(sgnTrx)
      } catch (error) {
        this.showError('Incorrect transaction: '+error.message)
        console.log(error)
        return
      }
      
      this.inputTrx = JSON.stringify(sgnTrx,null,2)
      this.showSuccess('Transaction signed')
    },
    
    async addHeaders () {
      //op = ['nothing',{}];
      /*op = ["escrow_transfer",
        {
	       from: 'jga',
	       to: 'nextvote',
	       sbd_amount: "0.000 SBD",
	       steem_amount: "1.000 STEEM",
	       escrow_id: 1,
	       agent: "steem",
	       fee: "0.100 STEEM",
	       json_meta: JSON.stringify(json_metadata),
	       ratification_deadline: ratification_deadline,
	       escrow_expiration: escrow_expiration
        }
      ];*/
    
      var op
      try {
        op = JSON.parse(this.inputTrx)
        this.hideError()
        console.log(op)
      } catch (error) {
        this.showError('Operation: '+error.message)
        console.log(error)
        return
      }
      
      var client = new Client(Config.RPC_NODE.url)
      
      const dgp = await client.database.getDynamicGlobalProperties()
      console.log(dgp);
      
      var head_block_number = dgp.head_block_number;
      var head_block_id = dgp.head_block_id;
      var prefix = Buffer.from(head_block_id, 'hex').readUInt32LE(4);
         
      var expireTime = 3590;
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
      console.log('input trx:')
      console.log(this.inputTrx)
      
      try {
        jsonTrx = JSON.parse(this.inputTrx)
        this.hideError()
        console.log(jsonTrx)
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
        return
      }
      console.log('unknown type of transaction')
      this.showError('Unknown type of transaction')
      //this.needHeaders = true;
    },
    
    startEventListenerFile() {
      /*var input = document.getElementById("inputFile");
      var label = input.nextElementSibling,
        labelVal = label.innerHTML;

      input.addEventListener("change", function(e) {
        var fileName = e.target.value.split("\\").pop();
        if (fileName) label.innerHTML = fileName;
        else label.innerHTML = labelVal;
      });*/
    },

    //Definition of the function to read a file using Promises (better for using await)
    //More info: https://blog.shovonhasan.com/using-promises-with-filereader/
    async readFileAsBuffer(inputFile) {
      /*const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onerror = () => {
          reader.abort();
          reject(new DOMException("Problem parsing file to upload"));
        };

        reader.onload = () => {
          //the result is an ArrayBuffer, we change it to Buffer.
          //this is important because the hash using 'crypto' is different in the 2 cases

          //TODO: [es-lint] says that Buffer is not defined, however it works
          var dataArrayBuffer = reader.result;
          var dataBuffer = new Buffer(dataArrayBuffer);
          resolve(dataBuffer);
        };
        reader.readAsArrayBuffer(inputFile);
      });*/
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
