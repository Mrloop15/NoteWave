<?php

namespace App\Providers;

use App\Actions\Identity\CreateNewUser;
use App\Actions\Identity\ResetUserPassword;
use App\Http\Responses\GenericPasswordResetLinkResponse;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse;
use Laravel\Fortify\Fortify;
use Laravel\Sanctum\Sanctum;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(SuccessfulPasswordResetLinkRequestResponse::class, GenericPasswordResetLinkResponse::class);
        $this->app->singleton(FailedPasswordResetLinkRequestResponse::class, GenericPasswordResetLinkResponse::class);
    }

    public function boot(): void
    {
        // This application accepts session cookies only, not personal access tokens.
        Sanctum::getAccessTokenFromRequestUsing(fn () => null);
        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);

        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(5)->by('login:'.hash('sha256', (string) $request->input('email')).'|'.$request->ip()),
            Limit::perMinute(30)->by('login-ip:'.$request->ip()),
        ]);
        RateLimiter::for('identity', fn (Request $request) => Limit::perMinute($request->is('register', 'forgot-password', 'reset-password') ? 5 : 60)->by($request->path().'|'.$request->ip())
        );
        RateLimiter::for('verification', fn (Request $request) => Limit::perMinute(6)->by((string) $request->user()?->id));

        ResetPassword::createUrlUsing(fn ($user, string $token) => rtrim(config('app.url'), '/').'/auth/reset-password?'.http_build_query(['token' => $token, 'email' => $user->email]));
        VerifyEmail::createUrlUsing(function ($user) {
            $signed = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())], absolute: false);

            return rtrim(config('app.url'), '/').'/auth/verify-email?'.http_build_query(['verification' => $signed]);
        });
        VerifyEmail::toMailUsing(fn ($user, string $url) => (new MailMessage)
            ->subject('Verifica tu correo en NoteWave')->greeting('Hola, '.$user->name)
            ->line('Confirma tu correo para empezar a usar tu espacio privado.')
            ->action('Verificar mi correo', $url)->line('El enlace vence en 60 minutos. Si no creaste esta cuenta, ignora este mensaje.'));
        ResetPassword::toMailUsing(fn ($user, string $token) => (new MailMessage)
            ->subject('Restablece tu contraseña de NoteWave')->greeting('Hola, '.$user->name)
            ->line('Recibimos una solicitud para cambiar tu contraseña.')
            ->action('Restablecer contraseña', rtrim(config('app.url'), '/').'/auth/reset-password?'.http_build_query(['token' => $token, 'email' => $user->email]))
            ->line('El enlace vence en 60 minutos. Si no lo solicitaste, puedes ignorarlo.'));
    }
}
