import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthCheck {
  motorId: string;
  model: string;
  issues: string[];
  fixed: boolean;
  suggestions: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { 
      quickCheck = false,
      checkBrokenImages = true, 
      fixIssues = false,
      generateReport = true,
      notifyAdmin = false
    } = await req.json().catch(() => ({}))

    console.log('Starting comprehensive motor health monitoring...')

    const healthReport = {
      timestamp: new Date().toISOString(),
      totalMotors: 0,
      healthyMotors: 0,
      issuesFound: 0,
      issuesFixed: 0,
      criticalIssues: 0,
      warnings: 0,
      checks: [] as HealthCheck[],
      summary: {
        brokenImages: 0,
        missingData: 0,
        outdatedInfo: 0,
        lowQualityImages: 0
      }
    }

    // Get all motors for health check
    const batchSize = quickCheck ? 20 : 50; // Smaller batches for faster response
    const { data: motors, error: motorsError } = await supabase
      .from('motor_models')
      .select('id, model, image_url, images, description, features, specifications, last_scraped, updated_at')
      .limit(batchSize)

    if (motorsError) {
      throw new Error(`Failed to fetch motors: ${motorsError.message}`)
    }

    healthReport.totalMotors = motors?.length || 0

    if (!motors || motors.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No motors to check',
        report: healthReport
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Performing ${quickCheck ? 'quick' : 'full'} health checks on ${motors.length} motors`)

    for (const motor of motors) {
      const check: HealthCheck = {
        motorId: motor.id,
        model: motor.model,
        issues: [],
        fixed: false,
        suggestions: []
      }

      let hasIssues = false

      // Check 1: Broken or missing images (with timeout protection)
      if (checkBrokenImages && !quickCheck) {
        if (motor.image_url) {
          try {
            // Add 2-second timeout for image checks
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch(motor.image_url, { 
              method: 'HEAD',
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              check.issues.push(`Main image URL returns ${response.status}`)
              healthReport.summary.brokenImages++
              hasIssues = true

              if (fixIssues) {
                // Try to auto-fix by finding alternative
                const { data: similarMotors } = await supabase
                  .from('motor_models')
                  .select('image_url, images')
                  .ilike('model', `%${motor.model.split(' ')[0]}%`)
                  .neq('id', motor.id)
                  .limit(3)

                if (similarMotors && similarMotors.length > 0) {
                  for (const similar of similarMotors) {
                    if (similar.image_url) {
                      try {
                        const testController = new AbortController();
                        const testTimeoutId = setTimeout(() => testController.abort(), 2000);
                        const testResponse = await fetch(similar.image_url, { 
                          method: 'HEAD',
                          signal: testController.signal
                        });
                        clearTimeout(testTimeoutId);
                        
                        if (testResponse.ok) {
                          await supabase
                            .from('motor_models')
                            .update({ image_url: similar.image_url })
                            .eq('id', motor.id)
                          
                          check.fixed = true
                          healthReport.issuesFixed++
                          console.log(`✓ Fixed broken image for ${motor.model}`)
                          break
                        }
                      } catch {
                        // Skip failed alternatives
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              check.issues.push(`Image URL check timed out`)
            } else {
              check.issues.push(`Image URL unreachable: ${error.message}`)
            }
            healthReport.summary.brokenImages++
            hasIssues = true
          }
        }

        // Check stored images (sample only for performance)
        if (Array.isArray(motor.images) && motor.images.length > 0) {
          let brokenCount = 0
          const sampleSize = Math.min(motor.images.length, 3); // Check max 3 images for performance
          const imagesToCheck = motor.images.slice(0, sampleSize);
          
          for (const img of imagesToCheck) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 2000);
              const response = await fetch(img.url, { 
                method: 'HEAD',
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              
              if (!response.ok) {
                brokenCount++
              }
            } catch {
              brokenCount++
            }
          }
          
          if (brokenCount > 0) {
            check.issues.push(`${brokenCount} of ${sampleSize} sampled images are broken`)
            healthReport.summary.brokenImages += brokenCount
            hasIssues = true
          }
        }
      } else if (quickCheck) {
        // Quick check - just verify image URLs exist without HTTP requests
        if (!motor.image_url && (!Array.isArray(motor.images) || motor.images.length === 0)) {
          check.issues.push('No image URLs available')
          healthReport.summary.brokenImages++
          hasIssues = true
        }
      }

      // Check 2: Missing critical data
      if (!motor.description) {
        check.issues.push('Missing description')
        healthReport.summary.missingData++
        hasIssues = true
        check.suggestions.push('Run motor details scraping')
      }

      if (!motor.features || motor.features.length === 0) {
        check.issues.push('Missing features')
        healthReport.summary.missingData++
        hasIssues = true
      }

      if (!motor.specifications || Object.keys(motor.specifications).length === 0) {
        check.issues.push('Missing specifications')
        healthReport.summary.missingData++
        hasIssues = true
      }

      // Check 3: Outdated information
      if (motor.last_scraped) {
        const lastScraped = new Date(motor.last_scraped)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        if (lastScraped < thirtyDaysAgo) {
          check.issues.push('Data older than 30 days')
          healthReport.summary.outdatedInfo++
          hasIssues = true
          check.suggestions.push('Schedule fresh scraping')
        }
      }

      // Check 4: Image quality and quantity
      const imageCount = Array.isArray(motor.images) ? motor.images.length : 0
      if (imageCount === 0 && motor.image_url) {
        check.issues.push('No images migrated to storage')
        check.suggestions.push('Run image migration')
        hasIssues = true
      } else if (imageCount === 1) {
        check.issues.push('Only one image available')
        check.suggestions.push('Scrape additional product images')
        healthReport.warnings++
      }

      if (hasIssues) {
        healthReport.issuesFound++
        
        // Categorize severity
        const criticalKeywords = ['unreachable', 'broken', 'missing description']
        const isCritical = check.issues.some(issue => 
          criticalKeywords.some(keyword => issue.toLowerCase().includes(keyword))
        )
        
        if (isCritical) {
          healthReport.criticalIssues++
        }
      } else {
        healthReport.healthyMotors++
      }

      healthReport.checks.push(check)

      // Rate limiting - less delay for quick checks
      if (!quickCheck) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }

    // Generate summary report
    const reportSummary = {
      overallHealth: ((healthReport.healthyMotors / healthReport.totalMotors) * 100).toFixed(1) + '%',
      criticalIssuesRequireAttention: healthReport.criticalIssues > 0,
      recommendedActions: [] as string[]
    }

    if (healthReport.summary.brokenImages > 0) {
      reportSummary.recommendedActions.push('Fix broken image URLs')
    }
    if (healthReport.summary.missingData > 0) {
      reportSummary.recommendedActions.push('Run motor details scraping for incomplete records')
    }
    if (healthReport.summary.outdatedInfo > 0) {
      reportSummary.recommendedActions.push('Schedule regular data refresh')
    }

    // Auto-notifications for critical issues
    if (notifyAdmin && healthReport.criticalIssues > 0) {
      try {
        await supabase.from('notifications').insert({
          user_id: '00000000-0000-0000-0000-000000000000', // System notification
          title: 'Critical Motor Data Issues Detected',
          message: `Found ${healthReport.criticalIssues} critical issues in motor database. Immediate attention required.`,
          type: 'error',
          metadata: { 
            source: 'motor-health-monitor',
            criticalCount: healthReport.criticalIssues,
            reportId: `health-${Date.now()}`
          }
        })
      } catch (error) {
        console.error('Failed to send notification:', error)
      }
    }

    console.log('Health monitoring completed:', {
      totalMotors: healthReport.totalMotors,
      healthy: healthReport.healthyMotors,
      issues: healthReport.issuesFound,
      critical: healthReport.criticalIssues
    })

    return new Response(JSON.stringify({
      success: true,
      report: {
        ...healthReport,
        summary: {
          ...healthReport.summary,
          ...reportSummary
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Health monitoring error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// Helper function to generate alternative image URLs
function generateAlternativeUrls(originalUrl: string): string[] {
  const alternatives = []
  
  try {
    // Convert thumb to detail
    if (originalUrl.includes('/thumb/')) {
      alternatives.push(originalUrl.replace('/thumb/', '/detail/'))
      alternatives.push(originalUrl.replace('/thumb/', '/large/'))
    }
    
    // Try different size variations
    if (originalUrl.includes('_thumb')) {
      alternatives.push(originalUrl.replace('_thumb', '_large'))
      alternatives.push(originalUrl.replace('_thumb', '_detail'))
    }
    
    // Try HTTPS if HTTP
    if (originalUrl.startsWith('http://')) {
      alternatives.push(originalUrl.replace('http://', 'https://'))
    }
    
  } catch (error) {
    console.error('Error generating alternative URLs:', error)
  }
  
  return alternatives
}