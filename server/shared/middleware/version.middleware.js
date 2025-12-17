/**
 * API Version Management Middleware
 * Handles API versioning, deprecation warnings, and version validation
 */

// Supported API versions configuration
const API_VERSIONS = {
  v1: {
    version: '1.0.0',
    status: 'stable',
    deprecated: false,
    deprecationDate: null,
    sunsetDate: null,
    releaseDate: '2024-01-01',
    features: ['Authentication', 'User Management', 'Ticket Management', 'Comments', 'WebSocket Support']
  }
  // Future versions can be added here
  // v2: {
  //   version: '2.0.0',
  //   status: 'beta',
  //   deprecated: false,
  //   deprecationDate: null,
  //   sunsetDate: null,
  //   releaseDate: '2024-06-01',
  //   features: ['Enhanced Authentication', 'Advanced Filtering', 'Bulk Operations']
  // }
};

const CURRENT_VERSION = 'v1';
const DEFAULT_VERSION = 'v1';

// Version validation regex
const VERSION_REGEX = /^v\d+$/;

/**
 * Middleware to validate API version from URL path
 */
export const validateApiVersion = (req, res, next) => {
  const versionMatch = req.path.match(/^\/api\/(v\d+)\//);
  
  if (!versionMatch) {
    // No version specified, use default
    req.apiVersion = DEFAULT_VERSION;
    req.versionInfo = API_VERSIONS[DEFAULT_VERSION];
    return next();
  }

  const requestedVersion = versionMatch[1];
  
  // Validate version format
  if (!VERSION_REGEX.test(requestedVersion)) {
    return res.status(400).json({
      success: false,
      message: `Invalid API version format '${requestedVersion}'. Expected format: v{number}`,
      data: {
        supportedVersions: Object.keys(API_VERSIONS),
        currentVersion: CURRENT_VERSION,
        example: 'v1'
      }
    });
  }
  
  if (!API_VERSIONS[requestedVersion]) {
    return res.status(400).json({
      success: false,
      message: `API version '${requestedVersion}' is not supported`,
      data: {
        supportedVersions: Object.keys(API_VERSIONS),
        currentVersion: CURRENT_VERSION,
        latestVersion: getLatestVersion()
      }
    });
  }

  const versionInfo = API_VERSIONS[requestedVersion];
  req.apiVersion = requestedVersion;
  req.versionInfo = versionInfo;

  // Add deprecation warning header if version is deprecated
  if (versionInfo.deprecated) {
    res.set('X-API-Deprecation-Warning', `API version ${requestedVersion} is deprecated since ${versionInfo.deprecationDate}`);
    if (versionInfo.sunsetDate) {
      res.set('X-API-Sunset-Date', versionInfo.sunsetDate);
    }
  }

  // Add version info to response headers
  res.set('X-API-Version', requestedVersion);
  res.set('X-API-Current-Version', CURRENT_VERSION);
  res.set('X-API-Latest-Version', getLatestVersion());

  next();
};

/**
 * Middleware to add version information to response
 */
export const addVersionInfo = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Add version info to successful responses
    if (data && typeof data === 'object' && data.success !== false) {
      data._meta = {
        apiVersion: req.apiVersion || DEFAULT_VERSION,
        timestamp: new Date().toISOString(),
        ...(data._meta || {})
      };
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Get version information
 */
export const getVersionInfo = () => ({
  versions: API_VERSIONS,
  currentVersion: CURRENT_VERSION,
  defaultVersion: DEFAULT_VERSION
});

/**
 * Check if a version is supported
 */
export const isVersionSupported = (version) => {
  return API_VERSIONS.hasOwnProperty(version);
};

/**
 * Get the latest stable version
 */
export const getLatestVersion = () => {
  return Object.entries(API_VERSIONS)
    .filter(([, info]) => info.status === 'stable')
    .sort(([, a], [, b]) => b.version.localeCompare(a.version))
    .map(([version]) => version)[0] || CURRENT_VERSION;
};