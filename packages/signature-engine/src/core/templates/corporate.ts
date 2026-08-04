/**
 * Premium corporate layout — table-based, inline styles, email-client-safe.
 *
 * Structure:
 *   Accent bar → header row (logo | info | content blocks side column on desktop) →
 *   stacked-style mobile blocks row after divider/address (duplicate {{contentBlocksHtml}}) →
 *   divider → address → footer bar.
 * Uses {{variables}} and {{#if key}}...{{/if}} (nested supported by renderer).
 */
export const CORPORATE_SIGNATURE_TEMPLATE = `<style type="text/css">
@media only screen and (min-width:601px),
  only screen and (min-device-width:601px) {
  tr.sig-blocks-stacked-row {
    display: none !important;
    max-height: 0 !important;
    overflow: hidden !important;
    mso-hide: all;
  }
  td.sig-blocks-desktop {
    display: table-cell !important;
  }
  td.sig-content-block-cell-left {
    padding-right: 12px !important;
  }
  td.sig-content-block-cell-right {
    padding-left: 12px !important;
    border-left: 1px solid #e5e5e5 !important;
    border-top: none !important;
  }
}
@media only screen and (max-width:600px),
  only screen and (max-width:768px),
  only screen and (max-device-width:600px),
  only screen and (max-device-width:812px) {
  table.sig-root-layout-table,
  table.sig-corp-header-layout-table {
    table-layout: auto !important;
    width: 100% !important;
  }
  td.sig-blocks-desktop {
    display: none !important;
    max-height: 0 !important;
    overflow: hidden !important;
    mso-hide: all;
  }
  tr.sig-blocks-stacked-row {
    display: table-row !important;
  }
  td.sig-content-block-cell {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    float: none !important;
    clear: both !important;
    box-sizing: border-box !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-bottom: 12px !important;
  }
  td.sig-content-block-cell-left {
    padding-bottom: 14px !important;
  }
  td.sig-content-block-cell-right {
    border-left: none !important;
    border-top: 1px solid #e5e5e5 !important;
    padding-top: 14px !important;
    padding-left: 0 !important;
  }
}
</style>
<table class="sig-root-layout-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family: {{fontFamily}}, Arial, Helvetica, sans-serif; font-size:14px; color:#1a1a1a; line-height:1.4; max-width:660px;width:100%;">
  <!-- Accent bar -->
  <tr>
    <td colspan="3" style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td bgcolor="{{primaryColor}}" height="4" style="font-size:0;line-height:0;mso-line-height-rule:exactly;padding:0;height:4px;background-color:{{primaryColor}};border:0;border-radius:2px;">&#8204;</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top:16px;" colspan="3">
      <table class="sig-corp-header-layout-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;">
        <tr>
          <!-- Logo column -->
          <td class="sig-corp-logo-stack" width="{{logoWidth}}" style="vertical-align:top;line-height:0;font-size:0;padding-right:20px;width:{{logoWidth}}px;">
            {{#if hasLogo}}
            <a href="{{logoLink}}" style="text-decoration:none; border:0; outline:none; display:block;">
{{#if hasLogoSizedHeight}}
              <img src="{{logoUrl}}" width="{{logoWidth}}" height="{{logoDisplayHeight}}" border="0" alt="" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:{{logoDisplayHeight}}px;border:0;outline:none;text-decoration:none;border-radius:{{logoImgBorderRadius}};" />
{{/if}}
{{#if hasLogoAutoHeight}}
              <img src="{{logoUrl}}" width="{{logoWidth}}" border="0" alt="" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:{{logoImgBorderRadius}};" />
{{/if}}
            </a>
            {{/if}}
            {{#if showAddressBlock}}
            <div style="margin-top: 8px; font-size: 11px; color: #888888; line-height: 1.35; letter-spacing: 0.2px;">
              {{addressBlockHtml}}
            </div>
            {{/if}}
          </td>

          <!-- Info column -->
          <td class="sig-corp-main-stack" style="vertical-align:top; border-left:3px solid {{primaryColor}}; padding-left:14px;padding-right:9px;mso-line-height-rule:exactly;">
            {{#if hasOrderedMainStack}}
            {{orderedMainStackHtml}}
            {{/if}}

            {{#if showSocialBlock}}
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-top:10px;"><tr>
              {{#if hasLinkedin}}
              <td style="{{socialTdLiStyle}}"><a href="{{linkedin}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconLinkedin}}" alt="LinkedIn" width="20" height="20" style="display:block;width:20px;height:20px;border:0;outline:none;text-decoration:none;" /></a></td>
              {{/if}}
              {{#if hasFacebook}}
              <td style="{{socialTdFbStyle}}"><a href="{{facebook}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconFacebook}}" alt="Facebook" width="20" height="20" style="display:block;width:20px;height:20px;border:0;outline:none;text-decoration:none;" /></a></td>
              {{/if}}
              {{#if hasInstagram}}
              <td style="{{socialTdIgStyle}}"><a href="{{instagram}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconInstagram}}" alt="Instagram" width="20" height="20" style="display:block;width:20px;height:20px;border:0;outline:none;text-decoration:none;" /></a></td>
              {{/if}}
              {{#if hasReddit}}
              <td style="{{socialTdRedditStyle}}"><a href="{{reddit}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconReddit}}" alt="Reddit" width="20" height="20" style="display:block;width:20px;height:20px;border:0;outline:none;text-decoration:none;" /></a></td>
              {{/if}}
              {{#if hasDiscord}}
              <td style="{{socialTdDiscordStyle}}"><a href="{{discord}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconDiscord}}" alt="Discord" width="20" height="20" style="display:block;width:20px;height:20px;border:0;outline:none;text-decoration:none;" /></a></td>
              {{/if}}
              {{#if hasBluesky}}
              <td style="{{socialTdBlueskyStyle}}"><a href="{{bluesky}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconBluesky}}" alt="Bluesky" width="20" height="20" style="display:block;width:20px;height:20px;border:0;outline:none;text-decoration:none;" /></a></td>
              {{/if}}
              {{#if hasYoutube}}
              <td style="{{socialTdYoutubeStyle}}"><a href="{{youtube}}" style="text-decoration:none;display:inline-block;border:0;outline:none;"><img src="{{iconYoutube}}" alt="YouTube" width="20" height="20" style="display:block;width:20px;height:20px;border:0;outline:none;text-decoration:none;" /></a></td>
              {{/if}}
            </tr></table>
            {{/if}}
          </td>

          {{#if sideColumnContentBlocks}}
          <td class="sig-corp-blocks-stack sig-blocks-desktop" valign="top" style="vertical-align:top;padding-left:11px;border-left:1px solid #e5e5e5;width:54%;min-width:212px;">
            {{contentBlocksHtml}}
          </td>
          {{/if}}

        </tr>
      </table>
    </td>
  </tr>
  {{#if hasDivider}}
  <tr>
    <td colspan="3" style="padding-top:16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td bgcolor="#e5e5e5" height="1" style="font-size:0;line-height:0;mso-line-height-rule:exactly;padding:0;height:1px;background-color:#e5e5e5;border:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
  {{/if}}

  {{#if sideColumnContentBlocks}}
  <tr class="sig-blocks-stacked-row">
    <td colspan="3" style="padding-top:12px;">
      {{contentBlocksHtmlStacked}}
    </td>
  </tr>
  {{/if}}

  <!-- Footer bar -->
  <tr>
    <td colspan="3" style="padding-top:12px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td bgcolor="{{primaryColor}}" height="28" style="font-size:11px;line-height:28px;mso-line-height-rule:exactly;padding:0 14px;height:28px;background-color:{{primaryColor}};border:0;color:#ffffff;font-family:{{fontFamily}}, Arial, Helvetica, sans-serif;font-weight:600;letter-spacing:0.5px;border-radius:2px;">
            {{companyName}}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
