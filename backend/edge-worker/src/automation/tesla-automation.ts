/**
 * TESLA AUTOMATION SYSTEM
 * 
 * Defines automation rules and triggers for intelligent Tesla journey management
 * Examples: State entry notifications, low battery alerts, charging complete notifications
 */

import { Env } from '../types/env';

interface AutomationRule {
  name: string;
  type: 'location' | 'battery' | 'charging' | 'time' | 'distance' | 'state';
  conditions: Record<string, any>;
  actions: Array<{
    type: 'notification' | 'webhook' | 'email' | 'social_share' | 'log';
    config: Record<string, any>;
  }>;
  priority: number;
  cooldown_minutes: number;
}

export class TeslaAutomationEngine {
  constructor(private env: Env) {}

  /**
   * Initialize default automation rules
   */
  async initializeAutomationRules(): Promise<void> {
    console.log('🤖 Initializing Tesla automation rules...');

    const defaultRules: AutomationRule[] = [
      // State Entry Celebrations
      {
        name: 'State Entry Celebration',
        type: 'state',
        conditions: {
          event: 'state_entered',
          is_new_state: true
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: 'Welcome to {state_name}! 🎉',
              message: 'You\'ve just entered state #{state_number} on your continental journey!',
              sound: 'celebration'
            }
          },
          {
            type: 'social_share',
            config: {
              platform: 'twitter',
              message: 'Just entered {state_name} on my #TeslaContinentalUSA road trip! State #{state_number}/48 ⚡🗺️',
              include_location: true
            }
          }
        ],
        priority: 8,
        cooldown_minutes: 60
      },

      // Low Battery Alerts
      {
        name: 'Low Battery Alert',
        type: 'battery',
        conditions: {
          battery_level: { operator: '<=', value: 15 },
          charging_state: { operator: '!=', value: 'Charging' },
          location_type: { operator: '!=', value: 'home' }
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '⚠️ Low Battery Alert',
              message: 'Battery at {battery_level}%. Finding nearby Superchargers...',
              urgency: 'high'
            }
          },
          {
            type: 'webhook',
            config: {
              url: 'https://api.tesla-route-finder.com/find-chargers',
              data: {
                latitude: '{current_latitude}',
                longitude: '{current_longitude}',
                battery_level: '{battery_level}',
                range_remaining: '{battery_range}'
              }
            }
          }
        ],
        priority: 10,
        cooldown_minutes: 15
      },

      // Charging Complete Notifications
      {
        name: 'Charging Complete',
        type: 'charging',
        conditions: {
          event: 'charging_complete',
          battery_level: { operator: '>=', value: 80 }
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '🔋 Charging Complete!',
              message: 'Charged to {battery_level}% at {location}. Ready to continue your journey!',
              sound: 'success'
            }
          },
          {
            type: 'log',
            config: {
              message: 'Charging session complete: {energy_added}kWh added in {duration} minutes'
            }
          }
        ],
        priority: 6,
        cooldown_minutes: 30
      },

      // Supercharger Arrival
      {
        name: 'Supercharger Arrival',
        type: 'location',
        conditions: {
          location_type: 'supercharger',
          event: 'location_arrived',
          charging_state: { operator: '=', value: 'Charging' }
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '⚡ Supercharging Started',
              message: 'Now charging at {location}. Estimated {minutes_to_target}min to {target_battery}%',
              include_charging_stats: true
            }
          },
          {
            type: 'webhook',
            config: {
              url: 'https://api.tesla-journey.com/charging-started',
              data: {
                location: '{location}',
                battery_start: '{battery_level}',
                charger_power: '{charger_power}'
              }
            }
          }
        ],
        priority: 7,
        cooldown_minutes: 60
      },

      // Overnight Stay Detection
      {
        name: 'Overnight Stay Detected',
        type: 'time',
        conditions: {
          event: 'overnight_stay_detected',
          stay_duration: { operator: '>=', value: 6 }, // 6+ hours
          time_of_day: { operator: 'between', value: [22, 6] } // 10 PM - 6 AM
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '🏨 Overnight Stay Detected',
              message: 'Staying overnight in {city}, {state}. Sleep well!',
              schedule_departure_reminder: true
            }
          },
          {
            type: 'log',
            config: {
              message: 'Overnight stay: {city}, {state} - Arrival: {arrival_time}'
            }
          }
        ],
        priority: 5,
        cooldown_minutes: 480 // 8 hours
      },

      // Journey Milestones
      {
        name: 'Distance Milestones',
        type: 'distance',
        conditions: {
          total_miles: { operator: 'milestone', values: [1000, 5000, 10000, 25000, 50000] }
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '🎯 Milestone Achieved!',
              message: 'You\'ve driven {total_miles} miles on your continental journey! 🎉',
              sound: 'achievement'
            }
          },
          {
            type: 'social_share',
            config: {
              platform: 'twitter',
              message: 'Just hit {total_miles} miles on my #TeslaContinentalUSA road trip! ⚡🛣️ #ElectricRoadTrip',
              include_journey_stats: true
            }
          }
        ],
        priority: 9,
        cooldown_minutes: 60
      },

      // Software Update Available
      {
        name: 'Software Update Available',
        type: 'time',
        conditions: {
          event: 'software_update_available',
          overnight_stay: true,
          battery_level: { operator: '>=', value: 50 }
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '📱 Tesla Software Update Available',
              message: 'Perfect time to update while parked overnight! Current: {current_version}',
              action_buttons: ['Update Now', 'Remind Later']
            }
          }
        ],
        priority: 4,
        cooldown_minutes: 720 // 12 hours
      },

      // Weather Alerts
      {
        name: 'Severe Weather Alert',
        type: 'location',
        conditions: {
          weather_alert: { operator: 'in', values: ['thunderstorm', 'snow', 'ice', 'tornado'] },
          driving_status: 'active'
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '⛈️ Severe Weather Alert',
              message: '{weather_type} detected ahead. Consider finding shelter or alternative route.',
              urgency: 'high'
            }
          },
          {
            type: 'webhook',
            config: {
              url: 'https://api.weather-routing.com/alternate-route',
              data: {
                current_location: '{current_location}',
                destination: '{planned_destination}',
                weather_conditions: '{weather_alert}'
              }
            }
          }
        ],
        priority: 10,
        cooldown_minutes: 30
      },

      // Efficiency Achievements
      {
        name: 'Efficiency Achievement',
        type: 'distance',
        conditions: {
          recent_efficiency: { operator: '>=', value: 4.0 }, // 4+ mi/kWh
          drive_distance: { operator: '>=', value: 50 }
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '🌱 Efficiency Master!',
              message: 'Awesome! You achieved {efficiency} mi/kWh on that {distance}mi drive!',
              sound: 'achievement'
            }
          },
          {
            type: 'log',
            config: {
              message: 'High efficiency achieved: {efficiency} mi/kWh over {distance} miles'
            }
          }
        ],
        priority: 6,
        cooldown_minutes: 120
      },

      // Home Return Detection
      {
        name: 'Journey Leg Complete',
        type: 'location',
        conditions: {
          location_type: 'home',
          event: 'location_arrived',
          time_away: { operator: '>=', value: 24 } // Away for 24+ hours
        },
        actions: [
          {
            type: 'notification',
            config: {
              title: '🏠 Welcome Home!',
              message: 'Journey leg complete! You drove {leg_miles} miles and visited {states_this_leg} states.',
              include_leg_summary: true
            }
          },
          {
            type: 'log',
            config: {
              message: 'Home arrival: {leg_miles} miles, {states_this_leg} states, {leg_duration} hours away'
            }
          }
        ],
        priority: 7,
        cooldown_minutes: 60
      }
    ];

    // Insert rules into database
    for (const rule of defaultRules) {
      await this.env.DB.prepare(`
        INSERT OR REPLACE INTO automation_rules 
        (rule_name, rule_type, trigger_conditions, actions, is_active, priority, cooldown_minutes)
        VALUES (?, ?, ?, ?, TRUE, ?, ?)
      `).bind(
        rule.name,
        rule.type,
        JSON.stringify(rule.conditions),
        JSON.stringify(rule.actions),
        rule.priority,
        rule.cooldown_minutes
      ).run();
    }

    console.log(`✅ Initialized ${defaultRules.length} automation rules`);
  }

  /**
   * Execute automation rules based on current vehicle state and events
   */
  async executeAutomationRules(eventType: string, eventData: Record<string, any>): Promise<void> {
    const activeRules = await this.env.DB.prepare(`
      SELECT * FROM automation_rules 
      WHERE is_active = TRUE 
      AND (rule_type = ? OR rule_type = 'time')
      AND (last_triggered IS NULL OR 
           datetime('now') > datetime(last_triggered, '+' || cooldown_minutes || ' minutes'))
      ORDER BY priority DESC
    `).bind(eventType).all();

    for (const rule of activeRules.results as any[]) {
      try {
        const conditions = JSON.parse(rule.trigger_conditions);
        const actions = JSON.parse(rule.actions);

        // Check if conditions are met
        if (await this.evaluateConditions(conditions, eventData)) {
          console.log(`🤖 Executing rule: ${rule.rule_name}`);

          // Execute all actions
          const executionResults = await this.executeActions(actions, eventData);

          // Log execution
          await this.logAutomationExecution(rule, eventType, eventData, executionResults);

          // Update last triggered
          await this.env.DB.prepare(`
            UPDATE automation_rules 
            SET last_triggered = datetime('now'), total_triggers = total_triggers + 1
            WHERE id = ?
          `).bind(rule.id).run();
        }
      } catch (error) {
        console.error(`Error executing rule ${rule.rule_name}:`, error);
      }
    }
  }

  /**
   * Evaluate if rule conditions are met
   */
  private async evaluateConditions(conditions: Record<string, any>, eventData: Record<string, any>): Promise<boolean> {
    for (const [key, condition] of Object.entries(conditions)) {
      const eventValue = eventData[key];

      if (typeof condition === 'object' && condition.operator) {
        switch (condition.operator) {
          case '<=':
            if (!(eventValue <= condition.value)) return false;
            break;
          case '>=':
            if (!(eventValue >= condition.value)) return false;
            break;
          case '=':
          case '==':
            if (eventValue !== condition.value) return false;
            break;
          case '!=':
            if (eventValue === condition.value) return false;
            break;
          case 'in':
            if (!condition.values.includes(eventValue)) return false;
            break;
          case 'between':
            const [min, max] = condition.value;
            if (!(eventValue >= min && eventValue <= max)) return false;
            break;
          case 'milestone':
            // Check if current value hits a milestone
            const milestones = condition.values || [];
            const lastValue = eventData[`last_${key}`] || 0;
            const hitMilestone = milestones.some((milestone: number) => 
              lastValue < milestone && eventValue >= milestone
            );
            if (!hitMilestone) return false;
            break;
          default:
            console.warn(`Unknown operator: ${condition.operator}`);
            return false;
        }
      } else {
        // Simple equality check
        if (eventValue !== condition) return false;
      }
    }

    return true;
  }

  /**
   * Execute automation actions
   */
  private async executeActions(actions: any[], eventData: Record<string, any>): Promise<any[]> {
    const results = [];

    for (const action of actions) {
      try {
        let result;

        switch (action.type) {
          case 'notification':
            result = await this.sendNotification(action.config, eventData);
            break;
          case 'webhook':
            result = await this.callWebhook(action.config, eventData);
            break;
          case 'email':
            result = await this.sendEmail(action.config, eventData);
            break;
          case 'social_share':
            result = await this.shareOnSocial(action.config, eventData);
            break;
          case 'log':
            result = await this.logMessage(action.config, eventData);
            break;
          default:
            console.warn(`Unknown action type: ${action.type}`);
            result = { success: false, error: 'Unknown action type' };
        }

        results.push({ action: action.type, result });
      } catch (error: any) {
        console.error(`Error executing action ${action.type}:`, error);
        results.push({ action: action.type, result: { success: false, error: error?.message || 'Unknown error' } });
      }
    }

    return results;
  }

  /**
   * Send notification (placeholder - integrate with your notification service)
   */
  private async sendNotification(config: any, eventData: Record<string, any>): Promise<any> {
    const message = this.interpolateTemplate(config.message || config.title, eventData);
    console.log(`🔔 Notification: ${message}`);
    
    // In production, integrate with push notification service
    return { success: true, message };
  }

  /**
   * Call webhook
   */
  private async callWebhook(config: any, eventData: Record<string, any>): Promise<any> {
    const url = this.interpolateTemplate(config.url, eventData);
    const data = this.interpolateObjectTemplate(config.data || {}, eventData);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    return { success: response.ok, status: response.status };
  }

  /**
   * Share on social media (placeholder)
   */
  private async shareOnSocial(config: any, eventData: Record<string, any>): Promise<any> {
    const message = this.interpolateTemplate(config.message, eventData);
    console.log(`📱 Social Share (${config.platform}): ${message}`);
    
    // In production, integrate with social media APIs
    return { success: true, platform: config.platform, message };
  }

  /**
   * Log message
   */
  private async logMessage(config: any, eventData: Record<string, any>): Promise<any> {
    const message = this.interpolateTemplate(config.message, eventData);
    console.log(`📝 Log: ${message}`);
    
    return { success: true, message };
  }

  /**
   * Send email (placeholder)
   */
  private async sendEmail(config: any, eventData: Record<string, any>): Promise<any> {
    const subject = this.interpolateTemplate(config.subject, eventData);
    const body = this.interpolateTemplate(config.body, eventData);
    console.log(`📧 Email: ${subject} - ${body}`);
    
    // In production, integrate with email service
    return { success: true, subject, body };
  }

  /**
   * Log automation execution
   */
  private async logAutomationExecution(
    rule: any, 
    eventType: string, 
    eventData: Record<string, any>, 
    results: any[]
  ): Promise<void> {
    await this.env.DB.prepare(`
      INSERT INTO automation_executions 
      (rule_id, rule_name, trigger_type, trigger_data, actions_executed, execution_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      rule.id,
      rule.rule_name,
      eventType,
      JSON.stringify(eventData),
      JSON.stringify(results),
      results.every(r => r.result.success) ? 'success' : 'partial'
    ).run();
  }

  /**
   * Interpolate template strings with event data
   */
  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key]?.toString() || match;
    });
  }

  /**
   * Interpolate object templates with event data
   */
  private interpolateObjectTemplate(obj: Record<string, any>, data: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.interpolateTemplate(value, data);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
}

// Export automation engine
export async function initializeTeslaAutomation(env: Env): Promise<void> {
  const automationEngine = new TeslaAutomationEngine(env);
  await automationEngine.initializeAutomationRules();
}

export async function triggerAutomationEvent(
  env: Env,
  eventType: string,
  eventData: Record<string, any>
): Promise<void> {
  const automationEngine = new TeslaAutomationEngine(env);
  await automationEngine.executeAutomationRules(eventType, eventData);
}
