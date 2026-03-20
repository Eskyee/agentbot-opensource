# Mobile Upload SDKs (iOS and Android)

Reference guide for uploading videos from native mobile applications using Mux Upload SDKs for iOS/iPadOS and Android.

## Overview

Mux provides native Upload SDKs for both iOS/iPadOS and Android platforms. These SDKs handle common tasks required to upload large video files, including:

- File chunking for large uploads
- Networking and retry logic
- Pause and resume functionality across app restarts
- Progress reporting
- Input standardization to minimize processing time

Both SDKs work with Direct Uploads, which provide authenticated URLs that allow client applications to upload content directly to Mux without intermediary steps.

## iOS/iPadOS SDK

### Platform Requirements

- iOS 14 and iPadOS 14, or higher
- macOS support added in version 0.7.0

### Installation

Install via Swift Package Manager:

1. Open your project in Xcode
2. Select File > Add Packages from the menu bar
3. Enter the SDK repository URL: `https://github.com/muxinc/swift-upload-sdk`
4. Select your dependency rule (defaults to latest version from `main` branch)
5. Click Add Package
6. Select your application target as the destination for `MuxUploadSDK`

Import the module in your code:

```swift
import MuxUploadSDK
```

### Basic Upload

Create and start a direct upload with progress tracking:

```swift
import MuxUploadSDK

// The url found in the response after creating a direct upload
let authenticatedURL: URL = /* fetch from trusted environment */

// URL to a video available locally in the application sandbox
let videoInputURL: URL = /* URL to a video available locally */

let directUpload = DirectUpload(
  uploadURL: authenticatedURL,
  inputFileURL: videoInputURL
)

// Log the progress to the console
directUpload.progressHandler = { state in
  print("Uploaded \(state.progress.completedUnitCount) / \(state.progress.totalUnitCount)")
}

// Start the direct upload
directUpload.start()
```

### Customizing Chunk Size

By default, the SDK splits videos into 8MB chunks. To customize:

```swift
import MuxUploadSDK

let authenticatedURL: URL = /* fetch from trusted environment */
let videoInputURL: URL = /* URL to a video available locally */

// Construct custom upload options to upload a file in 6MB chunks
let chunkSizeInBytes = 6 * 1024 * 1024
let options = DirectUploadOptions(
  chunkSizeInBytes: chunkSizeInBytes
)

// Initialize a DirectUpload with custom options
let directUpload = DirectUpload(
  uploadURL: authenticatedURL,
  inputFileURL: videoInputURL,
  options: options
)

directUpload.progressHandler = { state in
  print("Uploaded \(state.progress.completedUnitCount) / \(state.progress.totalUnitCount)")
}

directUpload.start()
```

Smaller chunk sizes result in more requests but are recommended for unstable or lossy networks. Larger chunk sizes lead to fewer requests that take longer to complete.

### Retry Configuration

When a chunk upload fails, the SDK automatically retries. The default retry limit is 3 attempts per chunk. To customize:

```swift
import MuxUploadSDK

let authenticatedURL: URL = /* fetch from trusted environment */
let videoInputURL: URL = /* URL to a video available locally */

// Construct custom upload options with a higher per-chunk retry limit
let options = DirectUploadOptions(
  retryLimitPerChunk: 5
)

// Initialize a DirectUpload that will retry each chunk request up to 5 times
let directUpload = DirectUpload(
  uploadURL: authenticatedURL,
  inputFileURL: videoInputURL,
  options: options
)

directUpload.start()
```

### Pause and Resume (iOS)

Handle app suspension or termination during uploads:

```swift
import MuxUploadSDK

class UploadCoordinator {
  func handleApplicationWillTerminate() {
    UploadManager.shared.allManagedUploads().forEach { upload in
      upload.pause()
    }
  }

  func handleApplicationDidBecomeActive() {
    UploadManager.shared.resumeAllUploads()
  }
}
```

A direct upload can be resumed as long as it remains in a `waiting` status and has not transitioned to `timed_out`. The timeout can be customized when creating the direct upload (between 1 minute and 7 days). Default timeout is 1 hour after creation.

### Input Standardization (iOS)

The SDK can adjust upload inputs locally to reduce processing time during ingestion. By default, input resolution is adjusted to 1920 x 1080 for larger inputs.

#### Setting Maximum Resolution

Reduce maximum resolution to 1280 x 720:

```swift
import MuxUploadSDK

let authenticatedURL: URL = /* fetch from trusted environment */
let videoInputURL: URL = /* URL to a video available locally */

// Reduce the maximum resolution to 1280 x 720
let options = DirectUploadOptions(
  inputStandardization: .init(maximumResolution: .preset1280x720)
)

let directUpload = DirectUpload(
  uploadURL: authenticatedURL,
  inputFileURL: videoInputURL,
  options: options
)

directUpload.start()
```

#### Skipping Input Standardization

To upload video as-is without local adjustments (Mux Video will still convert non-standard inputs during ingestion):

```swift
import MuxUploadSDK

let authenticatedURL: URL = /* fetch from trusted environment */
let videoInputURL: URL = /* URL to a video available locally */

// Skip adjustments to your input locally
let options = DirectUploadOptions(
  inputStandardization: .skipped
)

let directUpload = DirectUpload(
  uploadURL: authenticatedURL,
  inputFileURL: videoInputURL,
  options: options
)

directUpload.start()
```

## Android SDK

### Installation

#### Add Maven Repository

Add the Mux maven repository to your project's `repositories` block.

Kotlin DSL (settings.gradle.kts or build.gradle.kts):
```kotlin
// In your repositories block
maven {
  url = uri("https://muxinc.jfrog.io/artifactory/default-maven-release-local")
}
```

Groovy (settings.gradle or build.gradle):
```groovy
// In your repositories block
maven {
  url "https://muxinc.jfrog.io/artifactory/default-maven-release-local"
}
```

#### Add Dependency

Add the upload SDK to your app's `dependencies` block.

Kotlin DSL:
```kotlin
// in your app's dependencies
implementation("com.mux.video:upload:0.4.1")
```

Groovy:
```groovy
// in your app's dependencies
implementation "com.mux.video:upload:0.4.1"
```

### Basic Upload (Android)

Kotlin:
```kotlin
/**
 * @param myUploadUri PUT URL fetched from a trusted environment
 * @param myVideoFile File where the local video is stored. The app must have permission to read this file
*/
fun beginUpload(myUploadUrl: Uri, myVideoFile: File) {
  val upl = MuxUpload.Builder(myUploadUrl, myVideoFile).build()
  upl.addProgressListener { innerUploads.postValue(uploadList) }
  upl.addResultListener {
    if (it.isSuccess) {
      notifyUploadSuccess()
    } else {
      notifyUploadFail()
    }
  }
  upl.start()
}
```

Java:
```java
/**
 * @param myUploadUri PUT URL fetched from a trusted environment
 * @param myVideoFile File where the local video is stored. The app must have permission to read this file
*/
public void beginUpload(Uri uploadUrl, File videoFile) {
  MuxUpload upload = new MuxUpload.Builder(uploadUri, videoFile).build();
  upload.setProgressListener(progress -> {
    handleProgress(progress);
  });
  upload.setResultListener(result -> {
    if (UploadResult.isSuccessful(progressResult)) {
      handleSuccess(UploadResult.getFinalProgress(progressResult));
    } else {
      handleFailure(UploadResult.getError(progressResult));
    }
  });
  upload.start();
}
```

### Resume Uploads After Network Loss or Process Death

The SDK tracks uploads in progress. Resume them on app startup using `MuxUploadManager`:

Kotlin:
```kotlin
// You can do this anywhere, but it's really effective to do early in app startup
MuxUploadManager.resumeAllCachedJobs()
```

Java:
```java
// You can do this anywhere, but it's really effective to do early in app startup
MuxUploadManager.INSTANCE.resumeAllCachedJobs()
```

### Find Uploads Already in Progress

`MuxUpload` objects are managed internally by the SDK. You can retrieve them without holding a reference:

Kotlin:
```kotlin
fun listenToUploadInProgress(videoFile: File) {
  val upload = MuxUploadManager.findUploadByFile(videoFile)
  upload?.setProgressListener { handleProgress(it) }
}
```

Java:
```java
public void listenToUploadInProgress(File videoFile) {
  MuxUpload uploadInProgress = MuxUploadManager.INSTANCE.findUploadByFile(videoFile);
  if (uploadInProgress != null) {
    uploadInProgress.setProgressListener(progress -> handleProgress(progress));
  }
}
```

### Coroutine Support

For Kotlin coroutines, use `awaitSuccess` instead of listeners:

```kotlin
suspend fun uploadFromCoroutine(videoFile: File): Result<UploadStatus> {
  val uploadUrl = withContext(Dispatchers.IO) {
    getUploadUrl()  // via call to your backend server
  }
  val upload = MuxUpload.Builder(uploadUrl, videoFile).build()
  // Set up your listener here too
  return upload.awaitSuccess()
}
```

### Input Standardization (Android)

The SDK scales down any input video larger than 4K (3840x2160 or 2160x3840) by default. You can choose to scale down further or disable standardization.

#### Disable Input Standardization

To upload without local processing (Mux Video will still convert non-standard inputs during ingestion):

Kotlin:
```kotlin
fun beginUpload(myUploadUrl: Uri, myVideoFile: File) {
  val upl = MuxUpload.Builder(myUploadUrl, myVideoFile)
    .standarizationRequested(false) // disable input processing
    .build()
  // add listeners etc
  upl.start()
}
```

Java:
```java
public void beginUpload(Uri uploadUrl, File videoFile) {
  MuxUpload upload = new MuxUpload.Builder(uploadUri, videoFile)
      .standarizationRequested(false) // disable input processing
      .build();
  // add listeners etc
  upload.start();
}
```

## Best Practices

### Creating Direct Uploads Securely

Do not create Direct Uploads directly from your mobile app. Instead:

1. Create Direct Uploads on your server backend
2. Return only the authenticated URL to your mobile client
3. Use the URL with the Upload SDK

### Network Considerations

- Use smaller chunk sizes on unstable or lossy networks
- Implement pause/resume to handle app lifecycle events
- Consider resuming uploads early in app startup

### Maximum Resolution

- iOS SDK: Default maximum resolution is 1920 x 1080, with option for 1280 x 720
- Android SDK: Default maximum resolution is 4K (3840 x 2160)
- Consider scaling down further to save user data costs

## SDK Repositories

- iOS/iPadOS: https://github.com/muxinc/swift-upload-sdk
- Android: https://github.com/muxinc/android-upload-sdk

## API Reference Summary

### iOS - DirectUpload

| Property/Method | Description |
|-----------------|-------------|
| `DirectUpload(uploadURL:inputFileURL:options:)` | Initialize with URL, file, and optional configuration |
| `start()` | Begin the upload |
| `pause()` | Pause the upload |
| `progressHandler` | Callback for upload progress updates |

### iOS - DirectUploadOptions

| Property | Description |
|----------|-------------|
| `chunkSizeInBytes` | Size of upload chunks (default: 8MB) |
| `retryLimitPerChunk` | Number of retry attempts per chunk (default: 3) |
| `inputStandardization` | Configure input processing or skip with `.skipped` |

### iOS - UploadManager

| Property/Method | Description |
|-----------------|-------------|
| `UploadManager.shared` | Singleton instance |
| `allManagedUploads()` | Get all active uploads |
| `resumeAllUploads()` | Resume all paused uploads |

### Android - MuxUpload

| Method | Description |
|--------|-------------|
| `MuxUpload.Builder(url, file)` | Create upload builder |
| `build()` | Build the MuxUpload instance |
| `start()` | Begin the upload |
| `pause()` | Pause the upload |
| `cancel()` | Cancel the upload |
| `addProgressListener()` | Add progress callback |
| `addResultListener()` | Add completion callback |
| `awaitSuccess()` | Coroutine-based completion |

### Android - MuxUpload.Builder

| Method | Description |
|--------|-------------|
| `standarizationRequested(Boolean)` | Enable/disable input standardization |
| `build()` | Build the MuxUpload instance |

### Android - MuxUploadManager

| Method | Description |
|--------|-------------|
| `resumeAllCachedJobs()` | Resume all paused/failed uploads |
| `findUploadByFile(File)` | Get MuxUpload instance for a file |
