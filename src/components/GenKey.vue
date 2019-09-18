<template>
  <div>
    <div class="container">    
      <form>
        <h1>Generate Keys</h1>
        <h3 class="mt-4">From master password</h3>
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
              <input type="text" class="form-control" id="password" placeholder="Password" v-model="password">
            </div>
          </div>
        </form>
        <div v-if="showKeys1" class="row">
          <div v-for="(value, role) in keys1" class="col-12">
            <h4 class="mt-3">{{role}}</h4>
            <div class="monospace">Public: {{value.public}}</div>
            <div class="monospace">Private: {{value.private}}</div>
          </div>
        </div>
        <div class="row mt-3">
          <div v-if="error1" class="alert alert-danger col-12">{{errorMsg1}}</div>
        </div>
        <h3 class="mt-4">From private key</h3>
        <form>
          <div class="form-group">
            <label for="privkey">Private Key</label>
            <input type="text" class="form-control" id="privkey" placeholder="Private Key" v-model="privkey">            
          </div>
        </form>
        <div class="row mt-3">
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
  name: 'GenKey',
  
  data() {
    return {
      username: '',
      password: '',
      privkey: '',
      keys1: {
        owner: { public: '', private: '' },
        active: { public: '', private: '' },
        posting: { public: '', private: '' },
        memo: { public: '', private: '' }
      },
      keys2: { public: '', private: '' },
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
      this.debounced_genFromPassword()
    },
    privkey: function() {    
      this.debounced_genFromPrivKey()
    }    
  },
  methods: {
    genFromPassword () {
      try {
        for(var role in this.keys1) {
          var p = PrivateKey.fromLogin(this.username, this.password, role)
          this.keys1[role].private = p.toString()
          this.keys1[role].public = p.createPublic(Config.STEEM_ADDRESS_PREFIX).toString()
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
        this.keys2.private = p.toString()
        this.keys2.public = p.createPublic(Config.STEEM_ADDRESS_PREFIX).toString()
        this.hideError2()
      } catch (error) {
        this.showError2('Incorrect private key: '+error.message)
        console.log(error)
        return
      } 
    },
    
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
    }    
  }
};
</script>

<style scoped>

.monospace{
  font-family: monospace;
  font-size: 1.1rem;  
}

</style>
