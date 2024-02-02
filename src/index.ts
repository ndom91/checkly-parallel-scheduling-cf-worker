/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
  mapMap: {
    CA: "🇨🇦",
    BR: "🇧🇷",
    US: "🇺🇸",
    JP: "🇯🇵",
    UK: "🇬🇧",
    FR: "🇫🇷",
  },
  async fetch(request, env, ctx) {
    const urlParams = new URL(request.url).searchParams;
    const failingCountries = JSON.parse(
      await env.WORKER_KV.get("failingCountries")
    );
    console.log("Currently Failing Countries:", failingCountries);

    const shouldFail = urlParams.get("fail");
    if (shouldFail) {
      return new Response(`Fail override success`, { status: 500 });
    }

    const colo = urlParams.get("colo");
    if (colo) {
      if (Object.keys(failingCountries).includes(colo)) {
        // Remove from failingCountries
        delete failingCountries[colo];
        await env.WORKER_KV.put(
          "failingCountries",
          JSON.stringify(failingCountries)
        );
      } else {
        // Add to failingCountries
        const failingCountries2 =
          JSON.parse(await env.WORKER_KV.get("failingCountries")) || {};
        failingCountries2[colo] =
          urlParams.get(`delay-${colo.toLowerCase()}`) || 0;
        await env.WORKER_KV.put(
          "failingCountries",
          JSON.stringify(failingCountries2)
        );
      }
    }

    // Visiting Country is blocked - 500!
    if (Object.keys(failingCountries).includes(request.cf.country)) {
      const delayDuration = failingCountries[request.cf.country];
      if (delayDuration > 0) {
        await new Promise((r) =>
          setTimeout(() => r(), parseInt(delayDuration))
        );
      }
      return new Response(`Bad Country ${request.cf.country}`, { status: 500 });
    }

    const updatedFailingCountries = JSON.parse(
      await env.WORKER_KV.get("failingCountries")
    );
    const html = `<!DOCTYPE html>
    <head>
      <title>Parallel Testing</title>
      <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🦝</text></svg>">
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">  
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        var url = new URL(window.location.href)
        url.search = ''
        window.history.replaceState({}, document.title, url.toString())
      </script>
    </head>
		<body class="grid place-items-center mt-4">
      <div class="inline-flex flex-col m-2 w-96 bg-white rounded-xl border shadow-sm">
        <form class="flex flex-col justify-center" action="https://parallel-colo-fail-test.ndo.workers.dev">
          <div class="py-3 px-4 bg-gray-100 rounded-t-xl border-b md:py-4 md:px-5">
            <p class="flex justify-between items-center mt-1 text-sm text-gray-500">
              <span>Parallel Scheduling Test</span>
              <span class="hover:cursor-help" title="Enter delay in milliseconds and click on respective\nflag buttons to toggle country blocking">
                <svg height="22" width="22" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"></path>
                </svg>
              </span>
            </p>
          </div>
          <div class="p-4 w-full max-w-sm">
            <h4 class="font-bold text-gray-800 text-md">
              <p class="flex justify-between">
                Currently Blocked:
                <span class="text-xl">${Object.keys(updatedFailingCountries)
                  .map((co) => `<span class="pr-3">${this.mapMap[co]}</span>`)
                  .join("")}</span>
              </p>
            </h4>
          </div>
          <div class="flex flex-col gap-y-2 justify-center m-4 mt-0">
            <div class="flex relative gap-x-2 w-full max-w-sm justify-stretch">
              <div class="w-full bg-white rounded-lg border border-gray-200">
                <div class="py-1.5 px-3 grow">
                  <span class="block text-xs text-gray-500">
                    Delay in ms
                  </span>
                  <input name="delay-ca" value="${
                    updatedFailingCountries["CA"] || 0
                  }" class="w-full h-8 text-xl text-gray-800 bg-transparent border-0 outline-none focus:ring-0" type="number" min="0" max="10000" step="100">
                </div>
              </div>
              <button data-testid="toggle-ca" class="${
                Object.keys(updatedFailingCountries).includes("CA")
                  ? "bg-red-600 hover:bg-red-200"
                  : "bg-white hover:bg-gray-50"
              } transition duration-300 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-800 shadow-sm disabled:opacity-50 disabled:pointer-events-none text-xl" name="colo" value="CA">
                🇨🇦
              </button>
            </div>
            <div class="flex relative gap-x-2 items-stretch w-full max-w-sm">
              <div class="w-full bg-white rounded-lg border border-gray-200">
                <div class="flex gap-x-1 justify-between items-center w-full">
                  <div class="py-2 px-3 grow">
                    <span class="block text-xs text-gray-500">
                      Delay in ms
                    </span>
                    <input name="delay-br" value="${
                      updatedFailingCountries["BR"] || 0
                    }" class="w-full h-8 text-xl text-gray-800 bg-transparent border-0 outline-none focus:ring-0" type="number" min="0" max="10000" step="100">
                  </div>
                </div>
              </div>
              <button data-testid="toggle-br" class="${
                Object.keys(updatedFailingCountries).includes("BR")
                  ? "bg-red-600 hover:bg-red-200"
                  : "bg-white hover:bg-gray-50"
              } transition duration-300 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-800 shadow-sm disabled:opacity-50 disabled:pointer-events-none text-xl" name="colo" value="BR">
                🇧🇷
              </button>
            </div>
            <div class="flex relative gap-x-2 items-stretch w-full max-w-sm">
              <div class="w-full bg-white rounded-lg border border-gray-200">
                <div class="flex gap-x-1 justify-between items-center w-full">
                  <div class="py-2 px-3 grow">
                    <span class="block text-xs text-gray-500">
                      Delay in ms
                    </span>
                    <input name="delay-us" value="${
                      updatedFailingCountries["US"] || 0
                    }" class="w-full h-8 text-xl text-gray-800 bg-transparent border-0 outline-none focus:ring-0" type="number" min="0" max="10000" step="100">
                  </div>
                </div>
              </div>
              <button data-testid="toggle-us" class="${
                Object.keys(updatedFailingCountries).includes("US")
                  ? "bg-red-600 hover:bg-red-200"
                  : "bg-white hover:bg-gray-50"
              } transition duration-300 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-800 shadow-sm disabled:opacity-50 disabled:pointer-events-none text-xl" name="colo" value="US">
                🇺🇸
              </button>
            </div>
            <div class="flex relative gap-x-2 items-stretch w-full max-w-sm">
              <div class="w-full bg-white rounded-lg border border-gray-200">
                <div class="flex gap-x-1 justify-between items-center w-full">
                  <div class="py-2 px-3 grow">
                    <span class="block text-xs text-gray-500">
                      Delay in ms
                    </span>
                    <input name="delay-jp" value="${
                      updatedFailingCountries["JP"] || 0
                    }" class="w-full h-8 text-xl text-gray-800 bg-transparent border-0 outline-none focus:ring-0" type="number" min="0" max="10000" step="100">
                  </div>
                </div>
              </div>
              <button data-testid="toggle-jp" class="${
                Object.keys(updatedFailingCountries).includes("JP")
                  ? "bg-red-600 hover:bg-red-200"
                  : "bg-white hover:bg-gray-50"
              } transition duration-300 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-800 shadow-sm disabled:opacity-50 disabled:pointer-events-none text-xl" name="colo" value="JP">
                🇯🇵
              </button>
            </div>
            <div class="flex relative gap-x-2 items-stretch w-full max-w-sm">
              <div class="w-full bg-white rounded-lg border border-gray-200">
                <div class="flex gap-x-1 justify-between items-center w-full">
                  <div class="py-2 px-3 grow">
                    <span class="block text-xs text-gray-500">
                      Delay in ms
                    </span>
                    <input name="delay-uk" value="${
                      updatedFailingCountries["UK"] || 0
                    }" class="w-full h-8 text-xl text-gray-800 bg-transparent border-0 outline-none focus:ring-0" type="number" min="0" max="10000" step="100">
                  </div>
                </div>
              </div>
              <button data-testid="toggle-uk" class="${
                Object.keys(updatedFailingCountries).includes("UK")
                  ? "bg-red-600 hover:bg-red-200"
                  : "bg-white hover:bg-gray-50"
              } transition duration-300 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-800 shadow-sm disabled:opacity-50 disabled:pointer-events-none text-xl" name="colo" value="UK">
                🇬🇧
              </button>
            </div>
            <div class="flex relative gap-x-2 items-stretch w-full max-w-sm">
              <div class="w-full bg-white rounded-lg border border-gray-200">
                <div class="flex gap-x-1 justify-between items-center w-full">
                  <div class="py-2 px-3 grow">
                    <span class="block text-xs text-gray-500">
                      Delay in ms
                    </span>
                    <input name="delay-fr" value="${
                      updatedFailingCountries["FR"] || 0
                    }" class="w-full h-8 text-xl text-gray-800 bg-transparent border-0 outline-none focus:ring-0" type="number" min="0" max="10000" step="100">
                  </div>
                </div>
              </div>
              <button data-testid="toggle-fr" class="${
                Object.keys(updatedFailingCountries).includes("FR")
                  ? "bg-red-600 hover:bg-red-200"
                  : "bg-white hover:bg-gray-50"
              } transition duration-300 py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-800 shadow-sm disabled:opacity-50 disabled:pointer-events-none text-xl" name="colo" value="FR">
                🇫🇷
              </button>
            </div>
          </div>
        </form>
        <div class="flex gap-2 justify-center items-center mb-3 w-full text-xs text-gray-300">
          <svg height="20" class="opacity-80" viewBox="0 0 350 89" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_2213_17961)">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M325.423 88.99H313.618L295.346 72.3126H310.858L318.41 78.8879L337.179 25.3586H349.682L325.413 89L325.423 88.99Z" fill="black"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M113.946 21.3636C111.157 21.3636 108.726 22.061 106.654 23.4458C104.582 24.8107 102.988 26.8132 101.842 29.4433C100.696 32.0536 100.128 35.132 100.128 38.9676C100.128 42.8032 100.706 46.0411 101.842 48.6513C102.998 51.2615 104.611 53.2341 106.684 54.5691C108.756 55.9041 111.147 56.5716 113.867 56.5716C115.391 56.5716 116.806 56.3724 118.101 55.9639C119.416 55.5654 120.582 54.9776 121.598 54.2005C122.624 53.4135 123.461 52.457 124.128 51.3313C124.816 50.2055 125.294 48.9203 125.553 47.4857L137.08 47.5355C136.781 50.0162 136.034 52.3973 134.838 54.6986C133.663 56.9801 132.078 59.0324 130.076 60.8356C128.093 62.6289 125.732 64.0436 122.973 65.0996C120.233 66.1357 117.134 66.6538 113.677 66.6538C108.866 66.6538 104.562 65.5579 100.776 63.3861C97.01 61.2142 94.0212 58.066 91.8294 53.9415C89.6476 49.8169 88.5616 44.8456 88.5616 38.9676C88.5616 33.0897 89.6675 28.0884 91.8792 23.9639C94.0909 19.8394 97.0996 16.7011 100.885 14.5392C104.671 12.3574 108.935 11.2715 113.677 11.2715C116.806 11.2715 119.695 11.7098 122.365 12.5866C125.045 13.4633 127.426 14.7484 129.498 16.4321C131.57 18.1059 133.254 20.1482 134.549 22.5691C135.864 24.99 136.711 27.7597 137.08 30.8879H125.553C125.344 29.3935 124.915 28.0685 124.268 26.9128C123.62 25.7372 122.783 24.741 121.767 23.9141C120.751 23.0872 119.575 22.4595 118.24 22.0212C116.925 21.5828 115.491 21.3636 113.946 21.3636ZM163.311 24.9701C166.121 24.9701 168.562 25.5878 170.654 26.8132C172.756 28.0286 174.4 29.792 175.555 32.0735C176.731 34.335 177.309 37.0448 177.289 40.203V65.9465H166.071V42.2055C166.091 39.7148 165.463 37.7721 164.178 36.3873C162.913 35.0025 161.139 34.3051 158.858 34.3051C157.334 34.3051 155.979 34.6339 154.803 35.2814C153.648 35.929 152.731 36.8755 152.064 38.1208C151.416 39.3462 151.087 40.8306 151.067 42.5641V65.9365H139.849V12.0286H150.748V32.6314H151.227C152.143 30.2403 153.618 28.3773 155.65 27.0224C157.682 25.6575 160.243 24.9701 163.311 24.9701ZM211.68 30.0809C209.956 28.3773 207.944 27.1021 205.623 26.2653C203.321 25.4085 200.841 24.9801 198.171 24.9801C194.205 24.9801 190.748 25.8568 187.799 27.6102C184.87 29.3636 182.599 31.8144 180.985 34.9527C179.371 38.0909 178.564 41.7472 178.564 45.9016C178.564 50.056 179.371 53.8618 180.985 56.9801C182.599 60.0884 184.9 62.4894 187.879 64.193C190.878 65.8767 194.464 66.7235 198.619 66.7235C201.956 66.7235 204.895 66.2154 207.436 65.1993C209.996 64.1631 212.088 62.7285 213.702 60.8854C215.336 59.0224 216.412 56.8506 216.94 54.3599L206.569 53.6725C206.181 54.6887 205.623 55.5455 204.885 56.2528C204.148 56.9502 203.261 57.4782 202.225 57.8369C201.189 58.1856 200.054 58.3649 198.808 58.3649C196.935 58.3649 195.311 57.9664 193.936 57.1793C192.562 56.3923 191.506 55.2665 190.748 53.812C190.011 52.3574 189.643 50.594 189.643 48.6015H217.179V45.523C217.179 42.0859 216.701 39.0872 215.735 36.5168C214.768 33.9365 213.423 31.7846 211.68 30.0809ZM190.39 41.6376C190.46 40.1831 190.828 38.858 191.506 37.6625C192.243 36.3474 193.259 35.3014 194.564 34.5342C195.879 33.7472 197.394 33.3487 199.087 33.3487C200.781 33.3487 202.146 33.7073 203.381 34.4247C204.626 35.122 205.603 36.0984 206.3 37.3437C206.997 38.589 207.356 40.0237 207.356 41.6376H190.39ZM238.43 33.7073C236.696 33.7073 235.182 34.1756 233.887 35.122C232.611 36.0585 231.605 37.4134 230.888 39.2067C230.171 41 229.812 43.142 229.812 45.7123C229.812 48.2827 230.171 50.4844 230.868 52.2877C231.585 54.1009 232.601 55.4757 233.897 56.4222C235.192 57.3686 236.716 57.8468 238.45 57.8468C239.725 57.8468 240.88 57.5878 241.897 57.0598C242.933 56.5317 243.78 55.7646 244.447 54.7684C245.134 53.7522 245.583 52.5367 245.792 51.1121H256.372C256.193 54.2005 255.356 56.9203 253.842 59.2715C252.347 61.6127 250.285 63.4359 247.655 64.7509C245.025 66.066 241.907 66.7235 238.31 66.7235C234.166 66.7235 230.599 65.8468 227.62 64.0934C224.651 62.32 222.37 59.8593 220.776 56.721C219.192 53.5728 218.405 50.0162 218.405 45.8717C218.405 41.7273 219.202 38.1009 220.796 34.9726C222.41 31.8344 224.701 29.3836 227.67 27.6301C230.639 25.8568 234.166 24.9701 238.25 24.9701C241.777 24.9701 244.865 25.6077 247.516 26.8929C250.156 28.1781 252.258 29.9714 253.802 32.2926C255.346 34.604 256.193 37.3238 256.352 40.452H245.772C245.473 38.4296 244.686 36.8057 243.401 35.5803C242.146 34.335 240.482 33.7073 238.43 33.7073ZM296.303 25.4981H283.122L270.171 40.8406H269.563V12.0286H258.345V65.9365H269.563V53.1046L272.601 49.6376L283.62 65.9465H307.521V12.0286H296.303V18.7684V25.4981ZM280.99 43.0125L296.303 25.5479V65.2789L280.99 43.0125ZM308.347 25.4981H320.133L326.121 45.8219L320.133 62.7186L308.347 25.4981Z" fill="black"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M75.251 49.2208V17.0325C75.251 8.02917 67.951 0.729141 58.9476 0.729141H16.9116C7.90824 0.729141 0.608205 8.02917 0.608205 17.0325V49.2208C-0.00321293 68.0855 10.024 71.5731 15.6382 72.195C19.8538 72.6862 24.0667 73.2642 28.2438 74.0263C28.1708 74.0141 28.7207 71.6368 28.7888 71.3959C28.9665 70.7681 29.183 70.1476 29.4848 69.5684C29.9082 68.7533 30.5043 68.0719 31.283 67.5828C31.7453 67.2927 32.2403 67.062 32.7351 66.8313C33.0164 66.7001 33.2976 66.569 33.5728 66.427C34.4439 65.9768 35.281 65.4342 35.9818 64.7455C36.6704 64.0715 36.8943 63.3172 36.8846 62.3609C36.8773 61.7598 36.7459 61.1661 36.5098 60.6137C36.2665 60.0443 35.9137 59.526 35.5 59.0686V59.071C35.0523 58.5794 34.5315 58.156 33.9694 57.8008C33.3635 57.4187 32.709 57.1121 32.0325 56.8785C31.3122 56.6303 30.5628 56.4649 29.806 56.3773C29.0078 56.2872 28.2 56.2848 27.4018 56.3724C26.5623 56.4624 25.7326 56.6522 24.9369 56.9345C24.0876 57.2362 23.2773 57.6426 22.5254 58.139C21.7029 58.6841 20.951 59.3338 20.2843 60.0614C19.5275 60.8838 18.8778 61.8012 18.3255 62.7721C17.6831 63.9036 17.1721 65.1081 16.7657 66.3467C16.2869 67.805 15.9537 69.3094 15.725 70.8261C10.2155 66.3454 7.65525 58.4919 7.65769 58.4894C11.8941 57.9225 16.9117 56.2702 14.6219 52.2138C7.25375 36.3752 8.64806 25.9435 26.993 38.5603C30.4265 37.132 33.6288 36.8424 37.8749 36.7524C37.8847 36.7548 37.8944 36.7548 37.9041 36.7548H37.9601H37.9893C42.2355 36.8448 45.4353 37.132 48.8712 38.5603C67.2138 25.9435 68.6105 36.3776 61.2423 52.2138L61.2448 52.2163C58.955 56.2726 63.9701 57.9249 68.209 58.4919C68.2114 58.4943 65.6491 66.354 60.1352 70.8338L60.1332 70.8343C60.133 70.8333 60.1329 70.8323 60.1327 70.8313C59.904 69.3129 59.5706 67.8067 59.0913 66.3467C58.6849 65.1105 58.1739 63.906 57.5315 62.7721C56.9791 61.8012 56.3294 60.8838 55.5726 60.0614C54.9059 59.3362 54.154 58.6841 53.3315 58.139C52.5796 57.6426 51.7693 57.2338 50.9201 56.9345C50.1244 56.6522 49.2946 56.4624 48.4551 56.3724C47.657 56.2848 46.8491 56.2872 46.051 56.3773C45.2942 56.4624 44.5447 56.6303 43.8245 56.8785C43.148 57.1121 42.4934 57.4187 41.8875 57.8008C41.3254 58.156 40.8047 58.5794 40.3569 59.071C39.9408 59.5285 39.5904 60.0468 39.3471 60.6162C39.1111 61.1685 38.9772 61.7623 38.9724 62.3633C38.9626 63.3196 39.1865 64.0715 39.8751 64.748C40.576 65.4366 41.413 65.9792 42.2842 66.4294C42.5588 66.5711 42.8395 66.7017 43.1202 66.8323C43.6156 67.0627 44.1111 67.2933 44.5739 67.5853C45.3526 68.0744 45.9488 68.7557 46.3722 69.5709C46.6715 70.15 46.8905 70.7705 47.0681 71.3983C47.1362 71.6392 47.6862 74.0166 47.6132 74.0287C51.8277 73.2598 56.0788 72.6782 60.3323 72.1843V72.183C65.9661 71.5285 75.8609 67.9661 75.2534 49.2208H75.251ZM15.0891 36.5553C14.8044 36.6161 14.5173 36.6988 14.2715 36.857C13.5455 37.3269 13.6388 38.3511 13.7102 39.1351L13.7102 39.1351C13.7168 39.2078 13.7233 39.2784 13.7288 39.3463C13.8554 40.8769 14.1912 42.4123 14.5927 43.9064C14.8725 44.9479 15.2156 45.9772 15.6536 46.9651C16.1476 46.1962 16.6951 45.4905 17.2669 44.8457C17.7341 44.3176 18.2159 43.831 18.6977 43.3857C21.3233 40.9572 23.9367 39.7502 23.9367 39.7502C21.4158 37.9374 18.34 35.8545 15.0915 36.5528L15.0891 36.5553ZM60.7702 36.5553C61.0549 36.6161 61.3421 36.6988 61.5878 36.857C62.3138 37.3269 62.2205 38.3511 62.1491 39.1351C62.1425 39.2078 62.1361 39.2784 62.1305 39.3463C62.0039 40.8769 61.6681 42.4123 61.2666 43.9064C60.9868 44.9479 60.6437 45.9772 60.2057 46.9651C59.7117 46.1962 59.1642 45.4905 58.5924 44.8457C58.1252 44.3176 57.6434 43.831 57.1616 43.3857C54.536 40.9572 51.9226 39.7502 51.9226 39.7502C54.4436 37.9374 57.5193 35.8545 60.7678 36.5528L60.7702 36.5553ZM42.6808 75.4717C42.6747 75.4583 42.6686 75.4444 42.6625 75.4304C42.6564 75.4164 42.6503 75.4024 42.6443 75.389C42.143 74.2624 41.121 73.452 39.9798 73.0335C38.6536 72.5468 37.1352 72.5541 35.8114 73.0578C34.6921 73.4837 33.7115 74.2842 33.2126 75.389L33.2125 75.3892C33.2004 75.4159 33.1883 75.4426 33.1761 75.4717C33.1745 75.475 33.1728 75.4783 33.1712 75.4823C33.1704 75.4842 33.1696 75.4864 33.1688 75.4888C34.1738 77.1313 35.9258 78.4258 37.8992 78.4477H37.9284H37.9576C39.9335 78.4282 41.6831 77.1361 42.6905 75.4912C42.6881 75.4863 42.6856 75.4815 42.6832 75.4742L42.6808 75.4717ZM29.7816 64.6433C30.8272 64.6433 31.6748 63.7957 31.6748 62.7502C31.6748 61.7046 30.8272 60.8571 29.7816 60.8571C28.7361 60.8571 27.8885 61.7046 27.8885 62.7502C27.8885 63.7957 28.7361 64.6433 29.7816 64.6433ZM46.0778 64.6433C47.1233 64.6433 47.9709 63.7957 47.9709 62.7502C47.9709 61.7046 47.1233 60.8571 46.0778 60.8571C45.0322 60.8571 44.1846 61.7046 44.1846 62.7502C44.1846 63.7957 45.0322 64.6433 46.0778 64.6433Z" fill="black"/>
            </g>
            <defs>
              <clipPath id="clip0_2213_17961">
              <rect width="350" height="89" fill="white"/>
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>
		</body>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  },
};
