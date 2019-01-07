<template>
  <div>
    <h1>Title</h1>
    <div class="container">
      <div class="row">
        <input type="text" placeholder="account" v-model="inputUsername">        
      </div>
      <div class="row">
        <div v-if="error" class="alert alert-danger">{{errorMsg}}</div>
        <div v-if="success" class="alert alert-success">{{successMsg}}</div>
      </div>
      <div v-if="accountLoaded">
        <h3 class="row">@{{username}} authorities</h3>
        <div v-for="roleForm in rolesForm">
          <h3 class="row mt-5 pl-3 bg-dark text-white">{{roleForm.role}}</h3>
          <div class="row">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Key</th>
                  <th scope="col">Weight</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(value, index) in accountMod[roleForm.role].key_auths">
                  <th scope="row" :class="{modified: value[2]==='modified', removed: value[2]==='removed'}">{{index+1}}</th>
                  <td :class="{modified: value[2]==='modified', removed: value[2]==='removed'}">{{value[0]}}</td>
                  <td :class="{modified: value[2]==='modified', removed: value[2]==='removed'}">{{value[1]}}</td>
                  <td><button class="btn btn-secondary" @click="removeKey(roleForm.role, 'key_auths', index)">{{value[3]}}</button></td>
                </tr>
                <tr v-for="(value, index) in accountMod[roleForm.role].account_auths">
                  <th scope="row" :class="{modified: value[2]==='modified', removed: value[2]==='removed'}">{{index+1}}</th>
                  <td :class="{modified: value[2]==='modified', removed: value[2]==='removed'}">{{value[0]}}</td>
                  <td :class="{modified: value[2]==='modified', removed: value[2]==='removed'}">{{value[1]}}</td>
                  <td><button class="btn btn-secondary" @click="removeKey(roleForm.role, 'account_auths', index)">{{value[3]}}</button></td>                        
                </tr>                
              </tbody>
              <tfoot>
                <tr>
                  <td></td>
                  <td :class="{modified: accountMod[roleForm.role].threshold.state==='modified'}">Threshold</td>
                  <td :class="{modified: accountMod[roleForm.role].threshold.state==='modified'}">{{accountMod[roleForm.role].weight_threshold}}</td>
                  <td v-if="accountMod[roleForm.role].threshold.state === 'modified'"><button class="btn btn-secondary" @click="undoThreshold(roleForm.role)">undo</button></td>
                </tr>
              </tfoot>
            </table>
            <div class="col-12">
              <form class="form-inline">
                <div class="form-group">
                  <label>key/account</label>
                  <input class="form-control" type="text" placeholder="key or account" v-model="roleForm.input.key">
                </div>  
                <input class="form-control" type="number" v-model="roleForm.input.weight">
                <button class="btn btn-primary" @click="addKey(roleForm.role)">Add</button>
              </form>
            </div>
            <div class="col-12">
              <form class="form-inline">
                <div class="form-group">
                  <label>New Threshold</label>
                  <input class="form-control" type="number" v-model="roleForm.input.threshold">
                  <button class="btn btn-primary" @click="modifyThreshold(roleForm.role)">Modify</button>
                </div>              
              </form>
            </div>
          </div>
        </div>
      </div>        
    </div>
  </div>
</template>

<script>
import { Client, PrivateKey } from 'dsteem'
import debounce from 'lodash.debounce'
import Config from '@/config.js'
import Utils from '@/utils.js'

export default {
  name: "Multisignature",

  data () {
    return {
      auth: {
        user: '',
        logged: false,
        imgUrl: '',
        keys: {
          owner: null,
          active: null,
          posting: null,
          memo: null
        }
      },
      inputUsername: '',
      username: '',
      account: {},
      accountMod: {},
      accountLoaded: false,      
      rolesForm: [
        {
          role: 'owner',
          input: { key: '', weight: 1, threshold: 1 }
        },{
          role: 'active',
          input: { key: '', weight: 1, threshold: 1 }
        },{
          role: 'posting',
          input: { key: '', weight: 1, threshold: 1 }
        }
      ],
      error: false,
      errorMsg: '',
      success: false,
      successMsg: '',      
    }
  },
  
  created () {
    this.debounced_getAccount = debounce(this.getAccount, 1000);
  },
  
  watch: {
    inputUsername: function () {
      let self = this
      this.debounced_getAccount()
        .catch(function (error) {
          console.log(error)
          self.showError(error.message)
        })
    }
  },
  
  methods: {
    async getAccount () {
      var client = new Client(Config.RPC_NODE.url)
      var inputUsername = this.inputUsername
      const accounts = await client.database.getAccounts([inputUsername])
      
      if (accounts.length === 0) {
        this.showError('@' + inputUsername + ' does not exists')
        return
      }
      
      this.username = inputUsername
      this.account = accounts[0]
      this.accountMod = accounts[0]
      var roles = ['owner','active','posting']
      for(var idr in roles){
        var role = roles[idr]
        for(var i in this.accountMod[role].key_auths){
          this.accountMod[role].key_auths[i][2] = 'original';
          this.accountMod[role].key_auths[i][3] = 'X';
        }
        for(var i in this.accountMod[role].account_auths){
          this.accountMod[role].account_auths[i][2] = 'original';
          this.accountMod[role].account_auths[i][3] = 'X';
        }
        this.accountMod[role].threshold = {
          original: this.accountMod[role].weight_threshold,
          state: 'original',
          button: 'X'
        }
      }

      var jsonMetadata = ''
      try {
        jsonMetadata = JSON.parse(this.account.json_metadata)
      } catch (error) {
        console.log('No json_metadata');
      }  
      this.hideError()      
      this.accountLoaded = true
    },
    
    idRole (role) {
      var id = 0
      switch (role){
        case 'owner':
          id = 0
          break
        case 'active':
          id = 1
          break
        case 'posting':
          id = 2
          break
        default:
          break
      }
      return id
    },
    
    addKey (role) {
      var id = this.idRole(role)
      var key = this.rolesForm[id].input.key
      var weight = this.rolesForm[id].input.weight
      this.accountMod[role].key_auths.push([key, weight, 'modified', 'X'])      
      this.rolesForm[id].input.key = ''
      this.rolesForm[id].input.weight = 1
    },
    
    removeKey (role, type_auth, index) {
      var id = this.idRole(role)
      switch(this.accountMod[role][type_auth][index][2]){
        case 'original':
          this.$set(this.accountMod[role][type_auth][index], 2, 'removed')
          this.$set(this.accountMod[role][type_auth][index], 3, 'undo')
          break
        case 'removed':
          this.$set(this.accountMod[role][type_auth][index], 2, 'original')
          this.$set(this.accountMod[role][type_auth][index], 3, 'X')
          break
        case 'modified':
          this.accountMod[role][type_auth].splice(index,1)
          break
        default:
          break        
      }
    },
    
    modifyThreshold (role) {
      var id = this.idRole(role)
      var threshold = this.rolesForm[id].input.threshold
      this.accountMod[role].weight_threshold = threshold
      this.accountMod[role].threshold.state = 'modified'
    },
    
    undoThreshold (role) {
      var id = this.idRole(role)
      var threshold = this.accountMod[role].threshold.original
      this.accountMod[role].weight_threshold = threshold
      this.accountMod[role].threshold.state = 'original'
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
  
}
</script>

<style scoped>

.modified{
  color: green
}

.removed{
  color: red;
  text-decoration: line-through
}

</style>
