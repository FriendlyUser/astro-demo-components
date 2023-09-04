<template>
    <form @submit="onSubmit($event)">
        <div class="space-y-12">
            <div class="border-b border-gray-900/10 pb-12">
                <div class="w-full text-right">
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" class="sr-only peer" v-model="showImageUpload" >
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Toggle me</span>
                    </label>
                </div>
                <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                    <div class="sm:col-span-6" v-if="!showImageUpload">
                        <div class="text-center border-2 border-dashed border-gray-300  ">
                            <textarea class ="h-64 max-2xl" v-model="text"></textarea>
                        </div>
                    </div>
                    <div class="sm:col-span-6" v-else>
                        <dropfile :onFileChange ="handleFilesChanged" />
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
        <button type="submit">Submit</button>
    </form>
  </template>
  
  <script>
  import Dropfile from './Dropfile.vue'
  import {storage, storageBucketId, functionId, functions, promptUrl} from './utils';

  
  export default {
    components: {
        Dropfile
    },
  
    data() {
      return {
        showImageUpload: false,
        text: '',
        option1: '',
        options1: ["math", "toys"],
        option2: '',
        options2: ["age", "anime"],
        files: [],
        llmResp: "",
      }
    },
  
    methods: {
        imageAdded(image) {
            // Handle uploaded image
        },
        async callLLM (prompt) {
            const resp = await fetch(`${promptUrl}/?prompt=${prompt}`, {
            
            })
            const data = await resp.json();

            return data;
            
        },
        async onSubmit(e) {
            e.preventDefault()
            console.log(this.files);
            if (this.files.length) {
                const file = this.files[0]; 
                 // get file name from file
                const name = file?.name;
                // refactor this later to its own function.
                if (file) {
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
                    // setWhatIsImage(parsed?.first_entry?.generated_text || "no image available");
                    console.log("What is parsed", parsed);
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
                    `;
                    console.log("did you get here")
                    const llmResp = await callLLM(question);
                    console.log(llmResp);
                    // extract the suggestion from the json object
                    const regex = /({[\s\S]*})/; 

                    const match = llmResp.resp.match(regex);
                    const parsedLlm = JSON.parse(match[1]);
                    this.llmResp = parsedLlm
                }
            }
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