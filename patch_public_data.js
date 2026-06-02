const fs = require('fs');
const filePath = 'app/api/shops/[shopId]/public-data/route.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Replace tenantClient = await getTenantClient(shopId);
content = content.replace(
  /const tenantClient = await getTenantClient\(shopId\);/,
  `const requestHost = request.headers.get('host') || 'localhost:3000';
    const protocol = requestHost.includes('localhost') ? 'http' : 'https';
    const baseUrl = \`\${protocol}://\${requestHost}\`;

    const cachedData = await cacheService.getOrSet(
      \`api_public_data:\${shopId}\`,
      async () => {
        const tenantClient = await getTenantClient(shopId);`
);

// We must also extract `const allowedDomains: string[] = customization.allowedDomains || [];` 
// so that we can pass it to the cached response.
// But we actually only care about returning it from the cache.

// Look for `return NextResponse.json({ ... }, { headers: corsHeaders });`
content = content.replace(
  /return NextResponse\.json\(\{\s*shop:\s*cleanShop,\s*products:\s*formattedProducts,\s*services:\s*formattedServices,\s*staff:\s*formattedStaff,\s*reviews\s*\}, \{ headers: corsHeaders \}\);/,
  `return {
          shop: cleanShop,
          products: formattedProducts,
          services: formattedServices,
          staff: formattedStaff,
          reviews,
          allowedDomains
        };
      },
      900 // 15 minutes TTL
    );

    if (!cachedData) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const { allowedDomains: cachedAllowedDomains, ...responseData } = cachedData;
    
    // Validate domain
    if (requestDomain && cachedAllowedDomains) {
      const isAllowed = cachedAllowedDomains.some((domain) =>
        requestDomain === domain || requestDomain.endsWith(\`.\${domain}\`)
      );

      if (!isAllowed) {
        logger.warn(\`Allowing unauthorized access to shop data from domain for demo: \${requestDomain}\`);
      }
    }

    // Set dynamic CORS origin if valid
    if (origin && cachedAllowedDomains) {
      try {
        const originHost = new URL(origin).hostname;
        const isOriginAllowed = cachedAllowedDomains.some((domain) => originHost === domain || originHost.endsWith(\`.\${domain}\`));
        if (isOriginAllowed) {
          corsHeaders['Access-Control-Allow-Origin'] = origin;
        } else {
          corsHeaders['Access-Control-Allow-Origin'] = origin;
        }
      } catch(e) {}
    }

    return NextResponse.json(responseData, { headers: corsHeaders });`
);

// Remove the `requestHost` definition that's further down
content = content.replace(
  /const requestHost = request\.headers\.get\('host'\) \|\| 'localhost:3000';\s*const protocol = requestHost\.includes\('localhost'\) \? 'http' : 'https';\s*const baseUrl = `\$\{protocol\}:\/\/\$\{requestHost\}`;/,
  ''
);

// Remove the redundant security check inside since we moved it outside
content = content.replace(
  /\/\/ If the request comes from a browser[\s\S]*?if \(!isAllowed\) \{[\s\S]*?\}[\s\S]*?\}/,
  ''
);

// Remove the redundant CORS dynamic origin setting inside since we moved it outside
content = content.replace(
  /\/\/ Set dynamic CORS origin if valid[\s\S]*?\} catch\(e\) \{\}\s*\}/,
  ''
);

fs.writeFileSync(filePath, content);
console.log('Patched');
