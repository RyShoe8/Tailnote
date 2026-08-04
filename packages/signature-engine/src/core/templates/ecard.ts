/**
 * eCard — light bordered card, primary top bar, name/role/contact left, framed logo right,
 * portfolio list footer with social icons. Primary color drives accent bar, role, links, and CTA.
 */
export const ECARD_SIGNATURE_TEMPLATE = `<table class="sig-ecard-root" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:500px;width:100%;font-family:{{fontFamily}},-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#1F2937;background-color:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px;overflow:hidden;">
  <tr>
    <td height="6" bgcolor="{{primaryColor}}" style="background-color:{{primaryColor}};font-size:1px;line-height:1px;mso-line-height-rule:exactly;padding:0;height:6px;border:0;">&nbsp;</td>
  </tr>
  <tr>
    <td style="padding:20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
        <tr>
          <td valign="top" style="padding-right:16px;">
            {{#if hasName}}
            <div data-sig-field="name" style="font-size:20px;font-weight:700;color:#111827;margin-bottom:2px;letter-spacing:-0.2px;">{{fullName}}</div>
            {{/if}}
            {{#if hasEcardRoleLine}}
            <div style="font-size:13px;font-weight:600;color:{{primaryColor}};margin-bottom:14px;letter-spacing:0.2px;">{{ecardRoleLine}}</div>
            {{/if}}
            {{#if hasEcardContactTable}}
            <table cellpadding="0" cellspacing="0" border="0" style="font-size:13px;color:#4B5563;border-collapse:collapse;">
              {{ecardContactTableHtml}}
            </table>
            {{/if}}
            {{#if hasEcardVcardUrl}}
            <a href="{{ecardVcardUrl}}" style="display:inline-block;background-color:{{primaryColor}};color:#FFFFFF;text-decoration:none;padding:7px 18px;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:0.3px;margin-top:2px;">Save Contact</a>
            {{/if}}
          </td>
          {{#if hasLogo}}
          <td width="120" valign="top" align="right" style="width:120px;">
            <div style="background-color:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px;padding:12px;width:{{ecardLogoFrameWidth}}px;box-sizing:border-box;overflow:hidden;text-align:center;">
              <a href="{{logoLink}}" style="text-decoration:none;border:0;outline:none;display:block;">
                {{#if hasLogoSizedHeight}}
                <img src="{{logoUrl}}" alt="{{companyName}}" width="{{logoWidth}}" height="{{logoDisplayHeight}}" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:{{logoDisplayHeight}}px;border:0;border-radius:{{logoImgBorderRadius}};" />
                {{/if}}
                {{#if hasLogoAutoHeight}}
                <img src="{{logoUrl}}" alt="{{companyName}}" width="{{logoWidth}}" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:auto;border:0;border-radius:{{logoImgBorderRadius}};" />
                {{/if}}
              </a>
            </div>
          </td>
          {{/if}}
        </tr>
      </table>
      {{#if hasEcardFooter}}
      <div style="border-top:1px solid #E5E7EB;margin-top:20px;padding-top:14px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
          <tr>
            {{#if hasEcardPortfolioSection}}
            <td valign="middle" style="font-size:12px;color:#6B7280;line-height:1.5;">
              {{ecardPortfolioSectionsHtml}}
            </td>
            {{/if}}
            {{#if showSocialBlock}}
            <td valign="middle" align="right" width="110" style="white-space:nowrap;width:110px;">
              <table cellpadding="0" cellspacing="0" border="0" align="right" style="border-collapse:collapse;">
                <tr>
                  {{#if hasLinkedin}}
                  <td style="{{ecardSocialTdLiStyle}}"><a href="{{linkedin}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconLinkedin}}" alt="LinkedIn" width="24" style="width:24px;height:auto;display:block;border:0;" /></a></td>
                  {{/if}}
                  {{#if hasFacebook}}
                  <td style="{{ecardSocialTdFbStyle}}"><a href="{{facebook}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconFacebook}}" alt="Facebook" width="24" style="width:24px;height:auto;display:block;border:0;" /></a></td>
                  {{/if}}
                  {{#if hasInstagram}}
                  <td style="{{ecardSocialTdIgStyle}}"><a href="{{instagram}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconInstagram}}" alt="Instagram" width="24" style="width:24px;height:auto;display:block;border:0;" /></a></td>
                  {{/if}}
                  {{#if hasReddit}}
                  <td style="{{ecardSocialTdRedditStyle}}"><a href="{{reddit}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconReddit}}" alt="Reddit" width="24" style="width:24px;height:auto;display:block;border:0;" /></a></td>
                  {{/if}}
                  {{#if hasDiscord}}
                  <td style="{{ecardSocialTdDiscordStyle}}"><a href="{{discord}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconDiscord}}" alt="Discord" width="24" style="width:24px;height:auto;display:block;border:0;" /></a></td>
                  {{/if}}
                  {{#if hasBluesky}}
                  <td style="{{ecardSocialTdBlueskyStyle}}"><a href="{{bluesky}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconBluesky}}" alt="Bluesky" width="24" style="width:24px;height:auto;display:block;border:0;" /></a></td>
                  {{/if}}
                  {{#if hasYoutube}}
                  <td style="{{ecardSocialTdYoutubeStyle}}"><a href="{{youtube}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconYoutube}}" alt="YouTube" width="24" style="width:24px;height:auto;display:block;border:0;" /></a></td>
                  {{/if}}
                </tr>
              </table>
            </td>
            {{/if}}
          </tr>
        </table>
      </div>
      {{/if}}
    </td>
  </tr>
</table>`;
