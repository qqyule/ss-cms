﻿using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SSCMS.Configuration;
using SSCMS.Core.Utils;
using SSCMS.Enums;
using SSCMS.Utils;

namespace SSCMS.Web.Controllers.Admin.Common.Editor
{
    public partial class ActionsController
    {
        [HttpPost, Route(RouteActionsUploadScrawl)]
        public async Task<ActionResult<UploadScrawlResult>> UploadScrawl([FromQuery] int siteId, [FromForm] UploadScrawlRequest request)
        {
            var site = await _siteRepository.GetAsync(siteId);

            var bytes = Convert.FromBase64String(request.File);

            var original = "scrawl.png";
            var fileName = _pathManager.GetUploadFileName(site, original);

            if (!_pathManager.IsImageExtensionAllowed(site, PathUtils.GetExtension(fileName)))
            {
                return new UploadScrawlResult
                {
                    Error = Constants.ErrorImageExtensionAllowed
                };
            }
            if (!_pathManager.IsImageSizeAllowed(site, request.File.Length))
            {
                return new UploadScrawlResult
                {
                    Error = Constants.ErrorImageSizeAllowed
                };
            }

            var localDirectoryPath = await _pathManager.GetUploadDirectoryPathAsync(site, UploadType.Image);
            var filePath = PathUtils.Combine(localDirectoryPath, fileName);

            await _pathManager.UploadAsync(bytes, filePath);
            if (site.IsImageAutoResize)
            {
                ImageUtils.ResizeImageIfExceeding(filePath, site.ImageAutoResizeWidth);
            }
            await _pathManager.AddWaterMarkAsync(site, filePath);

            var imageUrl = await _pathManager.GetSiteUrlByPhysicalPathAsync(site, filePath, true);
            var isAutoStorage = await _storageManager.IsAutoStorageAsync(siteId, SyncType.Images);
            if (isAutoStorage)
            {
                var (success, url) = await _storageManager.StorageAsync(siteId, filePath);
                if (success)
                {
                    imageUrl = url;
                }
            }

            return new UploadScrawlResult
            {
                State = "SUCCESS",
                Url = imageUrl,
                Title = original,
                Original = original,
                Error = null
            };
        }
    }
}
