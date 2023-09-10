<script setup lang="ts">
  import { onMounted, ref } from "vue"
  import { LottieAnimation } from "lottie-web-vue"
  import WatermelonJSON from "../assets/animation_lmdnrahd.json";

  let anim = ref()

  onMounted(() => {
    setTimeout(() => {
      console.log(anim.value.goToAndPlay(150, true))
      anim.value
    }, 500)
  })
</script>
<template>
    <form @submit="onSubmit($event)">
        <div class="space-y-12">
            <div class="border-b border-gray-900/10 pb-12">
                <div class="w-full text-right">
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" class="sr-only peer" v-model="showImageUpload" :disabled="isLoading || searchItems.length >= 1" >
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                                <div v-if="showImageUpload">
                                    Switch to text input
                                </div>
                                <div v-else>
                                    Switch to image upload
                                </div>
                            </span>
                    </label>
                </div>
                <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div class="sm:col-span-6">
                        <div v-if="isLoading" class="max-h-96 mx-auto" id="lottie">
                            <LottieAnimation 
                                :animation-data="WatermelonJSON"
                                :auto-play="true"
                                :loop="true"
                                :speed="1"
                                class="max-h-96"
                                ref="anim" />
                        </div>
                        <div v-else-if="searchItems.length >= 1">
                            <h1 class="text-2xl">Recommended Toys</h1>
                        </div>
                        <div v-else>
                            <div v-if="!showImageUpload">
                                <div class="text-center border-2 border-dashed border-gray-300  ">
                                    <textarea class ="h-64 w-full" v-model="text"></textarea>
                                </div>
                            </div>
                            <div v-else>
                                <dropfile :onFileChange ="handleFilesChanged" />
                            </div>
                        </div>
                    </div>
                    <!--                 
                    <select v-model="option1">
                        <option v-for="opt in options1">{{ opt }}</option>
                    </select>
                
                    <select v-model="option2">
                        <option v-for="opt in options2">{{ opt }}</option>
                    </select> 
                    -->
                </div>
            </div>
        </div>
        <div v-if="!isLoading && searchItems.length == 0">
            <button type="submit">Submit</button>
        </div>
    </form>
    <!-- <div v-if="llmResp">
        {{ llmResp }}
    </div> -->
    <div v-if="searchItems.length >= 1">
        <!-- ... -->  
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div class="-mx-6 grid grid-cols-2 gap-0.5 overflow-hidden sm:mx-0 sm:rounded-2xl md:grid-cols-3">
                <!-- loop through searchItems-->
                <a v-for="item in searchItems" :href="item.link" :key="item.link">
                    <img class="max-h-24 w-full object-contain" :src="item.defaultImage" />
                    <p class="text-center font-bold">{{ item.title }}</p>
                </a>
            </div>
        </div>
    </div>
  </template>
  
  <script lang="ts">
  import Dropfile from './Dropfile.vue'
  import {storage, storageBucketId, functionId, functions, promptUrl, googleApiKey, get, googleSearchEngineId} from './utils';


    
  export default {
    components: {
        Dropfile
    },
  
    data() {
      return {
        showImageUpload: false,
        text: '',
        option1: '',
        isLoading: false,
        options1: ["math", "toys"],
        option2: '',
        options2: ["age", "anime"],
        files: [],
        llmResp: "",
        searchItems: [],
      }
    },
  
    methods: {
        imageAdded(image) {
            // Handle uploaded image
        },
        async callLLM (prompt) {
            const resp = await fetch(`${promptUrl}/?prompt=${prompt}`, {
                timeout: 60000
            })
            const data = await resp.json();

            return data;
            
        },

        async googleSearch(query) {
            try {
                const resp = await fetch(`https://www.googleapis.com/customsearch/v1?q=${query}&key=${googleApiKey}&cx=${googleSearchEngineId}`)
                const data = await resp.json();
                const queryItems = get(data, 'items');
                // map through queryItems grab first image in cse_image
                const simpleItems = queryItems.map(item => {
                    const defaultImage = item?.pagemap?.cse_image?.[0]?.src || item?.pagemap?.cse_thumbnail?.src;
                    return {
                        ...item,
                        defaultImage
                    }
                })
                // remove entry with no defaultImage
                const filteredItems = simpleItems.filter(item => item.defaultImage)
                return filteredItems
            } catch (e) {
                console.log(e);
                this.queryResp = '';
            }
        },

        async processFile(file) {
            const name = file?.name;
            const timestamp = new Date().getTime() * 1000; 
            const filename = `${timestamp}-${name}`;
            const response = await storage.createFile(storageBucketId, filename, file);
            const fileId = response.$id;
            const data = {
                "bucketId": storageBucketId,
                "fileId": fileId
            };
            const dataStr = JSON.stringify(data);
            // data stringify
            const functionResp = await functions.createExecution(functionId, dataStr);
            // unix timestamp
            // parse json response from string
            const parsed = JSON.parse(functionResp.response);

            return parsed;

        },

        async handlePrompt(parsed) {
            const question = `
            Given the following description

            '''
            ${parsed?.first_entry?.generated_text}
            '''

            provide suggestions of toys that are suitable

            ensure the response is in json and in the following format

            '''
            [
                {
                    "name": "",
                    "age_range": "",
                    "safety": "",
                    "durability": ""
                },
                ...
            ]
            '''
            only return json.
            `;
            const llmResp = await this.callLLM(question);
            // extract the suggestion from the json object
            const regex = /(\[[\s\S]*\])/;
            const parsedResp = llmResp.resp?.replace("/n", "");
            const match = parsedResp.match(regex);
            const parsedLlm = JSON.parse(match[1]);
            this.llmResp = parsedLlm

            // iterate through first object key in parsedLlm
            const firstKey = Object.keys(parsedLlm[0])[0];
            const firstValue = parsedLlm[0][firstKey];
            const simplifiedItems = await this.googleSearch(firstValue);
            this.searchItems = simplifiedItems;
        },
        async onSubmit(e) {
            e.preventDefault()
            if (this.isLoading) {
                return
            }
            this.isLoading = true
            if (this.text?.length && this.showImageUpload === false) {
                await this.handlePrompt(this.text);
            } else {
                if (this.files.length) {
                const file = this.files[0]; 
                 // get file name from file
                // refactor this later to its own function.
                if (file) {
                    const parsed = await this.processFile(file);
                    // migrate all the code above to another function, so users can just input text
                    await this.handlePrompt(parsed);
                    // setWhatIsImage(parsed?.first_entry?.generated_text || "no image available");
                    
                }
            }
            }
            
            this.isLoading = false
        },
        
        
        handleFilesChanged(files) {
            console.log("[handleFilesChanged]");
            // Handle file changes
            this.files = files
            console.log(files);
        } 
    }
  }
  </script>

<style>
#lottie svg {
    max-height: 384px;
}
</style>