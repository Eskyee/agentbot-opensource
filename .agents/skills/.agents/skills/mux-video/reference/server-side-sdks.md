# Server-Side SDKs

Reference guide for Mux server-side SDKs covering installation, authentication, and basic usage for Node.js, Python, Ruby, PHP, Go, Java, Elixir, and C#.

## Overview

Mux provides official server-side SDKs for multiple programming languages to interact with the Mux API. All SDKs use HTTP Basic Authentication with your Mux access token credentials (Token ID and Token Secret).

| Language | Package | Repository |
|----------|---------|------------|
| Node.js | `@mux/mux-node` | [mux-node-sdk](https://github.com/muxinc/mux-node-sdk) |
| Python | `mux-python` | [mux-python](https://github.com/muxinc/mux-python) |
| Ruby | `mux_ruby` | [mux-ruby](https://github.com/muxinc/mux-ruby) |
| PHP | `mux/mux-php` | [mux-php](https://github.com/muxinc/mux-php) |
| Go | `mux-go` | [mux-go](https://github.com/muxinc/mux-go) |
| Java | `mux-sdk-java` | [mux-java](https://github.com/muxinc/mux-java) |
| Elixir | `mux` | [mux-elixir](https://github.com/muxinc/mux-elixir) |
| C# | `Mux.Csharp.Sdk` | [mux-csharp](https://github.com/muxinc/mux-csharp) |

## Node.js SDK

### Installation

Add a dependency on the `@mux/mux-node` package via npm or yarn.

```bash
npm install @mux/mux-node
```

### Authentication and Basic Usage

```javascript
import Mux from '@mux/mux-node';
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

const asset = await mux.video.assets.create({
  input: [{ url: 'https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4' }],
  playback_policy: ['public'],
});
```

## Python SDK

### Installation

Install the module using `pip` or by installing from source.

```bash
# Via pip
pip install git+https://github.com/muxinc/mux-python.git

# Via source
git checkout https://github.com/muxinc/mux-python.git
cd mux-python
python setup.py install --user
```

### Authentication and Basic Usage

```python
import os
import mux_python
from mux_python.rest import ApiException

# Authentication Setup
configuration = mux_python.Configuration()
configuration.username = os.environ['MUX_TOKEN_ID']
configuration.password = os.environ['MUX_TOKEN_SECRET']

# API Client Initialization
assets_api = mux_python.AssetsApi(mux_python.ApiClient(configuration))

# List Assets
print("Listing Assets: \n")
try:
    list_assets_response = assets_api.list_assets()
    for asset in list_assets_response.data:
        print('Asset ID: ' + asset.id)
        print('Status: ' + asset.status)
        print('Duration: ' + str(asset.duration) + "\n")
except ApiException as e:
    print("Exception when calling AssetsApi->list_assets: %s\n" % e)
```

## Ruby SDK

### Installation

Add `mux_ruby` to your project's `Gemfile`.

```ruby
gem 'mux_ruby'
```

### Authentication and Basic Usage

```ruby
require 'mux_ruby'

# Auth Setup
openapi = MuxRuby.configure do |config|
  config.username = ENV['MUX_TOKEN_ID']
  config.password = ENV['MUX_TOKEN_SECRET']
end

# API Client Init
assets_api = MuxRuby::AssetsApi.new

# List Assets
puts "Listing Assets in account:\n\n"

assets = assets_api.list_assets()
assets.data.each do | asset |
  puts "Asset ID: #{asset.id}"
  puts "Status: #{asset.status}"
  puts "Duration: #{asset.duration.to_s}\n\n"
end
```

## PHP SDK

### Installation

Add Mux PHP to your `composer.json` via Packagist.

```bash
composer require mux/mux-php
```

### Authentication and Basic Usage

```php
// Authentication Setup
$config = MuxPhp\Configuration::getDefaultConfiguration()
    ->setUsername(getenv('MUX_TOKEN_ID'))
    ->setPassword(getenv('MUX_TOKEN_SECRET'));

// API Client Initialization
$assetsApi = new MuxPhp\Api\AssetsApi(
    new GuzzleHttp\Client(),
    $config
);

// Create Asset Request
$input = new MuxPhp\Models\InputSettings(["url" => "https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4"]);
$createAssetRequest = new MuxPhp\Models\CreateAssetRequest(["input" => $input, "playback_policy" => [MuxPhp\Models\PlaybackPolicy::PUBLIC_PLAYBACK_POLICY] ]);

// Ingest
$result = $assetsApi->createAsset($createAssetRequest);

// Print URL
print "Playback URL: https://stream.mux.com/" . $result->getData()->getPlaybackIds()[0]->getId() . ".m3u8\n"
```

## Go SDK

### Installation

Pull the Mux Go SDK from GitHub.

```bash
go get github.com/muxinc/mux-go
```

### Authentication and Basic Usage

```go
package main

import (
    "fmt"
    "os"
    "github.com/muxinc/mux-go"
)

func main() {
    // API Client Initialization
    client := muxgo.NewAPIClient(
        muxgo.NewConfiguration(
            muxgo.WithBasicAuth(os.Getenv("MUX_TOKEN_ID"), os.Getenv("MUX_TOKEN_SECRET")),
        ))
    // Create the Asset
    asset, err := client.AssetsApi.CreateAsset(muxgo.CreateAssetRequest{
        Input: []muxgo.InputSettings{
            muxgo.InputSettings{
                Url: "https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4",
            },
        },
        PlaybackPolicy: []muxgo.PlaybackPolicy{muxgo.PUBLIC},
    })

    // Check everything was good, and output the playback URL
    if err == nil {
        fmt.Printf("Playback URL: https://stream.mux.com/%s.m3u8 \n", asset.Data.PlaybackIds[0].Id)
    } else {
        fmt.Printf("Oh no, there was an error: %s \n", err)
    }
}
```

## Java SDK

### Installation

There are several ways to add the Mux Java SDK to your project.

#### Maven

Add this dependency to your project's POM:

```xml
<dependency>
  <groupId>com.mux</groupId>
  <artifactId>mux-sdk-java</artifactId>
  <version>1.0.0</version>
  <scope>compile</scope>
</dependency>
```

#### Gradle

Add this dependency to your project's build file:

```gradle
compile "com.mux:mux-sdk-java:1.0.0"
```

### Authentication and Basic Usage

```java
// Import classes:
import com.mux.ApiClient;
import com.mux.ApiException;
import com.mux.Configuration;
import com.mux.auth.*;
import com.mux.models.*;
import com.mux.sdk.AssetsApi;

public class Example {
  public static void main(String[] args) {
    ApiClient defaultClient = Configuration.getDefaultApiClient();
    defaultClient.setBasePath("https://api.mux.com");

    // Configure HTTP basic authorization: accessToken
    HttpBasicAuth accessToken = (HttpBasicAuth) defaultClient.getAuthentication("accessToken");
    accessToken.setUsername("YOUR USERNAME");
    accessToken.setPassword("YOUR PASSWORD");

    AssetsApi apiInstance = new AssetsApi(defaultClient);
    CreateAssetRequest createAssetRequest = {"input":[{"url":"https://muxed.s3.amazonaws.com/leds.mp4"}],"playback_policy":["public"],"video_quality":"basic"};
    try {
      AssetResponse result = apiInstance.createAsset(createAssetRequest)
            .execute();
      System.out.println(result);
    } catch (ApiException e) {
      System.err.println("Exception when calling AssetsApi#createAsset");
      System.err.println("Status code: " + e.getCode());
      System.err.println("Reason: " + e.getResponseBody());
      System.err.println("Response headers: " + e.getResponseHeaders());
      e.printStackTrace();
    }
  }
}
```

## Elixir SDK

### Installation

Add `mux` to your list of dependencies in `mix.exs`.

```elixir
def deps do
  [
    {:mux, "~> 3.2.1"}
  ]
end
```

### Authentication and Basic Usage

Configure your access token in your application configuration:

```elixir
# config/dev.exs
config :mux,
  access_token_id: "abcd1234",
  access_token_secret: "efghijkl"
```

Then use this config to initialize a new client in your application:

```elixir
client = Mux.client()
```

You can also pass the access token ID and secret directly to the `client/2` function:

```elixir
client = Mux.client("access_token_id", "access_token_secret")
```

Now use the client to upload new videos, manage playback IDs, etc.

```elixir
params = %{
  input: "https://example.com/video.mp4"
}
{:ok, asset, _} = Mux.Video.Assets.create(client, params);
```

## C# SDK

### Frameworks Supported

- .NET Core >=1.0
- .NET Framework >=4.6
- Mono/Xamarin >=vNext

### Dependencies

- [RestSharp](https://www.nuget.org/packages/RestSharp) - 106.11.4 or later
- [Json.NET](https://www.nuget.org/packages/Newtonsoft.Json/) - 12.0.3 or later
- [JsonSubTypes](https://www.nuget.org/packages/JsonSubTypes/) - 1.7.0 or later
- [System.ComponentModel.Annotations](https://www.nuget.org/packages/System.ComponentModel.Annotations) - 4.7.0 or later

Install packages via NuGet:

```
Install-Package RestSharp
Install-Package Newtonsoft.Json
Install-Package JsonSubTypes
Install-Package System.ComponentModel.Annotations
```

**Note:** RestSharp versions greater than 105.1.0 have a bug which causes file uploads to fail. See [RestSharp#742](https://github.com/restsharp/RestSharp/issues/742).

### Installation

Generate the DLL using your preferred tool (e.g. `dotnet build`).

Then include the DLL (under the `bin` folder) in the C# project, and use the namespaces:

```csharp
using Mux.Csharp.Sdk.Api;
using Mux.Csharp.Sdk.Client;
using Mux.Csharp.Sdk.Model;
```

### Webhook Compatibility Note

At this moment, this SDK is not suitable for parsing or modeling webhook payloads, due to some incompatibilities in the API spec and SDK generation tooling. The SDK should only be used for Mux's REST APIs.

### Proxy Configuration

To use the API client with a HTTP proxy, setup a `System.Net.WebProxy`:

```csharp
Configuration c = new Configuration();
System.Net.WebProxy webProxy = new System.Net.WebProxy("http://myProxyUrl:80/");
webProxy.Credentials = System.Net.CredentialCache.DefaultCredentials;
c.Proxy = webProxy;
```

### Authentication and Basic Usage

```csharp
using System.Collections.Generic;
using System.Diagnostics;
using Mux.Csharp.Sdk.Api;
using Mux.Csharp.Sdk.Client;
using Mux.Csharp.Sdk.Model;

namespace Example
{
    public class Example
    {
        public static void Main()
        {

            Configuration config = new Configuration();
            config.BasePath = "https://api.mux.com";
            // Configure HTTP basic authorization: accessToken
            config.Username = "YOUR_USERNAME";
            config.Password = "YOUR_PASSWORD";

            var apiInstance = new AssetsApi(config);
            var createAssetRequest = new CreateAssetRequest();

            try
            {
                // Create an asset
                AssetResponse result = apiInstance.CreateAsset(createAssetRequest);
                Debug.WriteLine(result);
            }
            catch (ApiException e)
            {
                Debug.Print("Exception when calling AssetsApi.CreateAsset: " + e.Message );
                Debug.Print("Status Code: "+ e.ErrorCode);
                Debug.Print(e.StackTrace);
            }

        }
    }
}
```

## Authentication Summary

All Mux SDKs use HTTP Basic Authentication. You need:

- **Token ID** (username): Your Mux access token ID
- **Token Secret** (password): Your Mux access token secret

Store these credentials securely using environment variables. Never commit credentials to source control.

| SDK | Username Property | Password Property |
|-----|-------------------|-------------------|
| Node.js | `tokenId` | `tokenSecret` |
| Python | `configuration.username` | `configuration.password` |
| Ruby | `config.username` | `config.password` |
| PHP | `setUsername()` | `setPassword()` |
| Go | `WithBasicAuth(id, secret)` | (combined) |
| Java | `accessToken.setUsername()` | `accessToken.setPassword()` |
| Elixir | `access_token_id` | `access_token_secret` |
| C# | `config.Username` | `config.Password` |
