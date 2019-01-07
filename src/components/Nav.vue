<template>
  <div>
    <div class="full-container" id="header">
      <div class="row">
        <div class="col d-flex justify-content-start">
          <div class="d-flex align-items-center">
            <!--<div id="logo"><img src="../assets/logo-multisignature.png" /></div>-->
          </div>
        </div>
        <div class="col d-flex justify-content-end">
          <div class="d-flex align-items-center">
            <div>
              <div v-if="auth.logged">
                <div id="image-profile"
                  v-bind:style="{ backgroundImage: 'url(' + auth.imgUrl + ')' }"
                >
                </div>
                <button class="btn btn-primary" @click="logout">Logout</button>
              </div>
              <div v-else>
                <button class="btn btn-primary" @click="login">Login</button>
                <b-modal ref="modalAuth" hide-footer title="Login">
                  <Auth ref="auth" v-on:login="auth = $event;" v-on:close="hideModal"></Auth>
                </b-modal>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import Auth from "@/components/Auth";

export default {
  name: "Nav",
  props: {
    portal: ""
  },
  data() {
    return {
      auth: {
        user: "",
        logged: false,
        imgUrl: "",
        keys: {
          owner: null,
          active: null,
          posting: null,
          memo: null
        }
      },
      showModal: false
    };
  },

  methods: {

    login() {
      this.$refs.modalAuth.show()
    },

    logout() {
      console.log("@" + this.auth.user + " logout");
      this.auth = {
        user: '',
        logged: false,
        imgUrl: "",
        keys: {
          owner: null,
          active: null,
          posting: null,
          memo: null
        }
      };
    },

    hideModal() {
      this.$refs.modalAuth.hide()
    },

  },
  components: {
    Auth
  }
}
</script>

<style scoped>
#header {
  padding: 10px;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.05);
}
#header .row{
  margin: 0px !important;
}

#logo {
  display: inline-block;
  height: 1.9rem;
}

#logo img {
  max-width: 100%;
  max-height: 100%;
}

#image-profile {
  display: inline-block;
  height: 2rem;
  width: 2rem;
  margin-right: 5px;
  overflow: hidden;
  background-size: cover;
  background-position: center center;
  border-radius: 50%;
  vertical-align: middle;
}

</style>
