import { useEffect, useState } from 'react'
import api from '../services/api'
import type { AutomationEvent } from '../types'

export default function AuditLog() {
  const [events, setEvents] = useState<AutomationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    loadEvents()
  }, [typeFilter])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const data = await api.getAutomationEvents(
        typeFilter ? { event_type: typeFilter } : undefined
      )
      setEvents(data.events)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventCategoryColor = (category?: string) => {
    switch (category) {
      case 'automation': return '#0056b3'
      case 'detection': return '#28a745'
      case 'user_action': return '#ffc107'
      default: return '#6c757d'
    }
  }

  return (
    <div>
      <h1>Automation Audit Log</h1>
      <p style={{ marginBottom: '20px' }}>Developer-grade debugging to replace browser console</p>

      <div className="card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setTypeFilter('')}
            className={typeFilter === '' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            All Events
          </button>
          <button
            onClick={() => setTypeFilter('autofill_executed')}
            className={typeFilter === 'autofill_executed' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Autofill
          </button>
          <button
            onClick={() => setTypeFilter('submit_evaluated')}
            className={typeFilter === 'submit_evaluated' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Submit
          </button>
          <button
            onClick={() => setTypeFilter('detection_result')}
            className={typeFilter === 'detection_result' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            Detection
          </button>
        </div>

        {loading ? (
          <div>Loading events...</div>
        ) : events.length === 0 ? (
          <div>No events found. Extension needs to be active to log events.</div>
        ) : (
          <div>
            {events.map(event => (
              <div
                key={event.id}
                style={{
                  borderBottom: '1px solid #eee',
                  padding: '15px',
                  marginBottom: '10px',
                  background: '#f9f9f9',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: 'white',
                        backgroundColor: getEventCategoryColor(event.event_category),
                        marginRight: '10px'
                      }}
                    >
                      {event.event_category || 'uncategorized'}
                    </span>
                    <strong>{event.event_type}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    {new Date(event.created_at).toLocaleString()}
                  </div>
                </div>

                {event.automation_decision && (
                  <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                    <strong>Decision:</strong> {event.automation_decision}
                  </div>
                )}

                {event.decision_reason && (
                  <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                    <strong>Reason:</strong> {event.decision_reason}
                  </div>
                )}

                <div style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
                  {event.task_id && `Task: #${event.task_id} | `}
                  {event.session_id && `Session: ${event.session_id} | `}
                  {event.detection_id && `Detection: ${event.detection_id}`}
                </div>

                {event.page_url && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '5px', wordBreak: 'break-all' }}>
                    {event.page_url}
                  </div>
                )}

                {event.page_intent && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Intent: {event.page_intent}
                    {event.ats_kind && ` | ATS: ${event.ats_kind}`}
                    {event.apply_stage && ` | Stage: ${event.apply_stage}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

