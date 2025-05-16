type ipAttempt = {
	count: number;
	lastAttempt: number;
	blockedUntil: number;
};

/**
 * Service class for managing failed login attempts by IP address.
 *
 * Responsibilities:
 * - Track and update failed login attempts per IP.
 * - Block IPs temporarily after reaching a configurable threshold.
 * - Reset attempt counters after a configurable cooldown period.
 *
 * Constructor parameters:
 * - blockDuration: how long an IP should be blocked (in seconds)
 * - maxFailedAttempts: number of failed attempts before blocking
 * - resetFailedAttemptsTime: time threshold to reset the attempt count (in seconds)
 *
 * Usage:
 * This class is intended to be injected as a service through Dependency Injection.
 * Use a factory provider to inject configuration values at runtime.
 */

export class LoginAttempts {
	failedAttempts = new Map<string, ipAttempt>();
	blockDuration: number;
	maxFailedAttempts: number;
	resetFailedAttemptsTime: number;

	constructor(
		blockDuration: number = 30,
		maxFailedAttempts: number = 5,
		resetFailedAttemptsTime: number = 300,
	) {
		this.blockDuration = blockDuration * 1000;
		this.maxFailedAttempts = maxFailedAttempts;
		this.resetFailedAttemptsTime = resetFailedAttemptsTime * 1000;
	}

	checkIfAddressIsAlreadyBlocked(ip: string) {
		if (!this.failedAttempts.has(ip))
			return { blocked: false, blockDurationMessage: '' };

		const attemptsForThisIP: ipAttempt = {
			...(this.failedAttempts.get(ip) as ipAttempt),
		};

		if (attemptsForThisIP.count < this.maxFailedAttempts) {
			return { blocked: false, blockDurationMessage: '' };
		}

		if (attemptsForThisIP.blockedUntil < Date.now()) {
			attemptsForThisIP.count = 0;
			attemptsForThisIP.blockedUntil = 0;
			this.failedAttempts.set(ip, attemptsForThisIP);

			return { blocked: false, blockDurationMessage: '' };
		}

		const remainingTime = Math.round(
			(attemptsForThisIP.blockedUntil - Date.now()) / 1000,
		);

		return {
			blocked: true,
			blockDurationMessage: `Too many failed attempts. Please try again in ${remainingTime} seconds.`,
		};
	}

	incrementOrResetCountAttempts(attemptsForThisIP: ipAttempt, now: number) {
		if (now - attemptsForThisIP.lastAttempt > this.resetFailedAttemptsTime) {
			attemptsForThisIP.count = 1;
		} else {
			attemptsForThisIP.count++;
		}
	}

	updateFailedAttempt(ip: string) {
		let attemptsForThisIP: ipAttempt;
		const now = Date.now();

		if (!this.failedAttempts.has(ip)) {
			attemptsForThisIP = {
				count: 1,
				lastAttempt: now,
				blockedUntil: 0,
			};
		} else {
			attemptsForThisIP = {
				...(this.failedAttempts.get(ip) as ipAttempt),
			};

			this.incrementOrResetCountAttempts(attemptsForThisIP, now);
			attemptsForThisIP.lastAttempt = now;
		}
		this.failedAttempts.set(ip, attemptsForThisIP);

		return {
			remainingAttemptsMessage: `Username or password is invalid. ${this.maxFailedAttempts - attemptsForThisIP.count} attempts before being blocked`,
		};
	}

	checkIfAddressReachedMaxAttempts(ip: string) {
		const attemptsForThisIP: ipAttempt = {
			...(this.failedAttempts.get(ip) as ipAttempt),
		};

		if (attemptsForThisIP.count >= this.maxFailedAttempts) {
			attemptsForThisIP.blockedUntil = Date.now() + this.blockDuration;
			this.failedAttempts.set(ip, attemptsForThisIP);

			return {
				blocked: true,
				blockDurationMessage: `Too many failed attempts. Please try again in ${Math.round(this.blockDuration / 1000)} seconds.`,
			};
		}

		return { blocked: false, blockDurationMessage: '' };
	}

	handleLoginFailure(ip: string) {
		const remainingAttemptsMessage = this.updateFailedAttempt(ip);

		const { blocked, blockDurationMessage } =
			this.checkIfAddressReachedMaxAttempts(ip);

		return {
			blocked,
			messages: { blockDurationMessage, remainingAttemptsMessage },
		};
	}
}
