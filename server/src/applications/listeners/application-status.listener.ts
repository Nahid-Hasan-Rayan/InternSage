/**
 * InternSage — ApplicationStatusListener
 *
 * Author : Nahid Hasan Rayan
 * Marker : NHR-BE-APPLICATIONS-LISTENER-001
 * File   : src/applications/listeners/application-status.listener.ts
 *
 * The whole point of ApplicationsService emitting
 * `application.statusChanged` instead of calling a notification
 * method directly: this listener can be replaced (add email, push,
 * SMS, whatever) without ApplicationsService ever changing. Today it
 * does the minimum honest thing — logs it and records an analytics
 * event — rather than pretending an email went out when none did.
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalyticsService } from '../../analytics/analytics.service';
import type { ApplicationStatusChangedEvent } from '../applications.service';

@Injectable()
export class ApplicationStatusListener {
  private readonly logger = new Logger(ApplicationStatusListener.name);

  constructor(private readonly analytics: AnalyticsService) {}

  @OnEvent('application.statusChanged')
  async handleStatusChanged(event: ApplicationStatusChangedEvent & { fromStatus: string | null }) {
    this.logger.log(
      `Application ${event.applicationId} for user ${event.applicantUserId}: ` +
        `${event.fromStatus ?? '(new)'} -> ${event.toStatus}`,
    );

    // Recorded via AnalyticsService rather than a dedicated
    // notifications table — there's no email/push channel wired up
    // yet (see this file's header comment), so this is the only
    // durable trace that the "no ghosting" guarantee actually fired
    // for this application right now.
    void this.analytics.record({
      type: 'REQUEST',
      userId: event.applicantUserId,
      metadata: {
        kind: 'application_status_changed',
        applicationId: event.applicationId,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
      },
    });
  }
}
