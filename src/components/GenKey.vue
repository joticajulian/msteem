<template>
  <div>
    <div class="container">    
      <form>
        <h1>Generate Keys</h1>
        <h3>From master password</h3>
        <form>
          <div class="form-group row">
            <label for="username" class="col-sm-2 col-form-label">Username</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" id="username" placeholder="username" v-model="username">
            </div>
          </div>
          <div class="form-group row">
            <label for="password" class="col-sm-2 col-form-label">Password</label>
            <div class="col-sm-10">
              <input type="password" class="form-control" id="password" placeholder="Password" v-model="password">
            </div>
          </div>
        </form>
        <div v-if="showKeys1">
          <div v-for="(value, role) in keys1">
            <h4 class="row mt-5 pl-3 bg-dark text-white">{{role}}</h4>
            <div class="row monospace">Public:  {{value.public}}</div>
            <div class="row monospace">Private: {{value.private}}</div>
          </div>
        </div>
        <div class="row mt-3">
          <div v-if="success1" class="alert alert-success col-12">{{successMsg1}}</div>
          <div v-if="error1" class="alert alert-danger col-12">{{errorMsg1}}</div>
        </div>
        <h3>From private key</h3>
        <form>
          <div class="form-group">
            <label for="privkey">Private Key</label>
            <input type="text" class="form-control" id="privkey" placeholder="Private Key" v-model="privkey">            
          </div>
        </form>
        <div class="row mt-3">
          <div v-if="success2" class="alert alert-success col-12">{{successMsg2}}</div>
          <div v-if="error2" class="alert alert-danger col-12">{{errorMsg2}}</div>
        </div>
        <div v-if="showKeys2">
          <div class="row monospace">Public:  {{keys2.public}}</div>
          <div class="row monospace">Private: {{keys2.private}}</div>
        </div>
      </form>            
    </div>
  </div>
</template>

<script>
import { Client, PrivateKey } from 'dsteem'
import debounce from "lodash.debounce";

import Config from "@/config.js";
import Utils from "@/utils.js";

export default {
  name: "GenKey",
  
  data() {
    return {
      username: '',
      password: '',
      privkey: '',
      keys1 = {
        owner: { public: '', private: '' },
        active: { public: '', private: '' },
        posting: { public: '', private: '' }
      },
      keys2 = { public: '', private: '' },
      error1: false,
      errorMsg1: '',
      error2: false,
      errorMsg2: '',
      showKeys1: false,
      showKeys2: false
    };
  },
  
  created() {
    this.debounced_genFromPassword = debounce(this.genFromPassword, 300);
    this.debounced_genFromPrivKey = debounce(this.genFromPrivKey, 300);
  },
  
  watch: {
    password: function() {
      this.debounced_genFromPassword();
      this.debounced_genFromPrivKey();
    }    
  },
  methods: {
    genFromPassword () {
      try {
        var roles = ['owner','active','posting']
        for(var role in keys1) {
          var p = PrivateKey.fromLogin(this.username, this.password, role)
          keys1[role].private = p.toString()
          keys1[role].public = p.createPublic(Config.STEEM_ADDRESS_PREFIX).toString()
        }          
        this.hideError1()
      } catch (error) {
        this.showError1('Error: '+error.message)
        console.log(error)
        return
      }
    },
    
    genFromPrivKey () {        
      try {
        var p = PrivateKey.fromString(this.privkey);
        keys2.private = p.toString()
        keys2.public = p.createPublic(Config.STEEM_ADDRESS_PREFIX).toString()
        this.hideError2()
      } catch (error) {
        this.showError2('Incorrect private key: '+error.message)
        console.log(error)
        return
      } 
    }
    
    showError1 (msg) {
      this.error1 = true
      this.errorMsg1 = msg
      this.showKeys1 = false      
    },
    
    showError2 (msg) {
      this.error2 = true
      this.errorMsg2 = msg
      this.showKeys2 = false
    },
    
    hideError1 () {
      this.error1 = false
      this.errorMsg1 = ''
      this.showKeys1 = true
    },
    
    hideError2 () {
      this.error2 = false
      this.errorMsg2 = ''
      this.showKeys2 = true
    },
    
  }
};
</script>

<style scoped>

.monospace{
  font-family: monospace;    
}

</style>
