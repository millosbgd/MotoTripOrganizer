using Azure.Storage.Blobs;
using Azure.Storage.Sas;

namespace MotoTripOrganizer.Infrastructure.Storage;

public interface IBlobStorageService
{
    Task<string> GenerateUploadUrlAsync(string containerName, string blobName, TimeSpan expiresIn);
    Task<string> UploadAsync(string containerName, string blobName, Stream content, string contentType);
    Task DeleteAsync(string containerName, string blobName);
}

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobServiceClient _blobServiceClient;

    public BlobStorageService(BlobServiceClient blobServiceClient)
    {
        _blobServiceClient = blobServiceClient;
    }

    /// <summary>
    /// Generates a SAS URL for direct upload from client
    /// </summary>
    public async Task<string> GenerateUploadUrlAsync(string containerName, string blobName, TimeSpan expiresIn)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        await containerClient.CreateIfNotExistsAsync();

        var blobClient = containerClient.GetBlobClient(blobName);

        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = containerName,
            BlobName = blobName,
            Resource = "b",
            StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5),
            ExpiresOn = DateTimeOffset.UtcNow.Add(expiresIn)
        };

        sasBuilder.SetPermissions(BlobSasPermissions.Create | BlobSasPermissions.Write);

        var sasUri = blobClient.GenerateSasUri(sasBuilder);
        return sasUri.ToString();
    }

    /// <summary>
    /// Uploads a file directly to blob storage (server-side upload)
    /// </summary>
    public async Task<string> UploadAsync(string containerName, string blobName, Stream content, string contentType)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        await containerClient.CreateIfNotExistsAsync();

        var blobClient = containerClient.GetBlobClient(blobName);
        
        await blobClient.UploadAsync(content, new Azure.Storage.Blobs.Models.BlobHttpHeaders
        {
            ContentType = contentType
        });

        return blobClient.Uri.ToString();
    }

    public async Task DeleteAsync(string containerName, string blobName)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(blobName);
        
        await blobClient.DeleteIfExistsAsync();
    }
}
