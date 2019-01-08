<template>
  <div>
    <div class="container">
      <h1>Modify Authorities</h1>
      <form>
        <div class="form-row">
          <div class="col-12 col-md-10">
            <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text" id="basic-addon1">@</span>
              </div>
              <input type="text" class="form-control" placeholder="Account" v-model="inputUsername">
            </div>
          </div>
          <div class="col-12 col-md-2">
            <button class="btn btn-primary col-12" @click="load">Load</button>
          </div>
        </div>
      </form>
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
              <thead v-if="accountMod[roleForm.role].key_auths.length>0">
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
              </tbody>
              <thead v-if="accountMod[roleForm.role].account_auths.length>0">
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Account</th>
                  <th scope="col">Weight</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
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
          </div>
          <div class="row">
            <div class="col-12">
              <form class="form-inline">
                <div class="form-row align-items-center">
                  <input class="form-control" type="text" placeholder="insert key or account" v-model="roleForm.input.key">
                  <input class="form-control ml-2" type="number" v-model="roleForm.input.weight">
                  <button class="btn btn-primary ml-2" @click="addKey(roleForm.role, 'key_auths')">Add key</button>
                  <button class="btn btn-primary ml-2" @click="addKey(roleForm.role, 'account_auths')">Add account</button>
                </div>
              </form>
            </div>
            <div class="col-12 mt-3">
              <form class="form-inline">
                <div class="form-row align-items-center">
                  <label>New Threshold</label>
                  <input class="form-control ml-2" type="number" v-model="roleForm.input.threshold">
                  <button class="btn btn-primary ml-2" @click="modifyThreshold(roleForm.role)">Modify</button>
                </div>              
              </form>
            </div>
          </div>
        </div>
        <div class="row mt-5 mb-2">
          <button class="btn btn-success btn-lg" @click="generateTrx">Generate Operation</button>
        </div>
        <div v-if="showTrx">
          <div class="row justify-content-end mt-2 mb-2">
            <button class="btn btn-primary" @click="copy">Copy</button>
          </div>
          <div class="row mt-2 mb-2">          
            <textarea class="form-control" id="trx" rows="15" v-model="trx" disabled></textarea>
          </div>
          <div class="row mt-2 mb-5">
            <button class="btn btn-success btn-lg" @click="signTrx">Sign Transaction</button>
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
      trx: '',
      showTrx: false,
      error: false,
      errorMsg: '',
      success: false,
      successMsg: '',      
    }
  },
  
  methods: {
    load () {        
      this.getAccount()
      .catch(function(error) {
        console.log(error)
      })
    },
    
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
    
    addKey (role, type_auth) {
      var id = this.idRole(role)
      var key = this.rolesForm[id].input.key
      var weight = this.rolesForm[id].input.weight
      this.accountMod[role][type_auth].push([key, weight, 'modified', 'X'])      
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
      this.accountMod[role].weight_threshold = Number(threshold)
      this.accountMod[role].threshold.state = 'modified'
    },
    
    undoThreshold (role) {
      var id = this.idRole(role)
      var threshold = this.accountMod[role].threshold.original
      this.accountMod[role].weight_threshold = threshold
      this.accountMod[role].threshold.state = 'original'
    },
    
    generateTrx () {
      var op = [
        'account_update',
        {
          account: this.username,
          memo_key: this.account.memo_key,
          json_metadata: this.account.json_metadata
        } 
      ]
      
      var auths = {owner:{key_auths:[],account_auths:[]},active:{key_auths:[],account_auths:[]},posting:{key_auths:[],account_auths:[]}}
      
      var roles = ['owner','active','posting']
      for(var idr in roles){
        var role = roles[idr]
        var hasModifications = false
        
        var typeAuths = ['key_auths','account_auths'] 
        for(var ida in typeAuths){
          var typeAuth = typeAuths[ida]
          console.log(JSON.stringify(this.accountMod[role][typeAuth]))
          for(var i in this.accountMod[role][typeAuth]){
            
            // get key from accountMod
            // example: 
            //   this.accountMod.posting.account_auths[2] = {'utopian-io',1,'modified','X'}
            //
            //   we only need {'utopian-io',1}
                      
            var key_auth = [
              this.accountMod[role][typeAuth][i][0],
              this.accountMod[role][typeAuth][i][1]
            ]
            var status = this.accountMod[role][typeAuth][i][2]  
            
            if(status === 'original' || status === 'modified') {
              auths[role][typeAuth].push(key_auth)
            }
          
            if(status === 'removed' || status === 'modified') {
              hasModifications = true
            }          
          }
        }
        
        // get threshold
        auths[role].weight_threshold = this.accountMod[role].weight_threshold
        if(this.accountMod[role].threshold.state === 'modified') {
          hasModifications = true
        }
        
        console.log(JSON.stringify(auths[role]))
        
        // Only include modifications in the Operation
        if(hasModifications) op[1][role] = auths[role]
      }
      
      this.trx = JSON.stringify(op, null, 2)
      this.showTrx = true
    },
    
    signTrx () {
      window.open(Config.URL_SIGN,'_blank')
    },
    
    copy () {
      Utils.copyTextToClipboard(this.trx)
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

#trx{
  font-family: monospace;
  font-size: 0.8rem;
}

.modified{
  color: green
}

.removed{
  color: red;
  text-decoration: line-through
}

</style>
