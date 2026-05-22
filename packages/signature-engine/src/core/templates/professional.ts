/**
 * Professional layout — same structure/breakpoints as corporate, card-style visuals.
 * Light grey panels per section (logo-style tint), brand color as accent only.
 */
export const PROFESSIONAL_SIGNATURE_TEMPLATE = `<style type="text/css">
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
  table.sig-prof-card-shell {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    overflow: visible !important;
  }
  tr.sig-prof-accent-row {
    display: none !important;
    max-height: 0 !important;
    overflow: hidden !important;
    mso-hide: all;
  }
}
</style>
<table class="sig-prof-card-shell" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;border-spacing:0;max-width:660px;width:100%;border:2px solid {{primaryColor}};border-radius:16px;overflow:hidden;background-color:#ffffff;">
  <tr>
    <td style="padding:0;">
<table class="sig-root-layout-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family: {{fontFamily}}, Arial, Helvetica, sans-serif; font-size:14px; color:#444; line-height:1.35; max-width:660px;width:100%;">
  <!-- Accent bar (hidden on narrow viewports; card shell top border replaces it) -->
  <tr class="sig-prof-accent-row">
    <td colspan="3" style="padding:0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td bgcolor="{{primaryColor}}" height="8" style="font-size:0;line-height:0;mso-line-height-rule:exactly;padding:0;height:8px;background-color:{{primaryColor}};border:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 10px 0 10px;" colspan="3">
      <table class="sig-corp-header-layout-table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;">
        <tr>
          <!-- Logo column -->
          <td class="sig-corp-logo-stack" valign="top" width="{{logoWidth}}" style="vertical-align:top;line-height:0;font-size:0;padding-right:14px;width:{{logoWidth}}px;">
            {{#if hasLogo}}
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
              <td bgcolor="#f0f4ff" style="background-color:#f0f4ff;border-radius:12px;padding:6px;line-height:0;font-size:0;">
            <a href="{{logoLink}}" style="text-decoration:none; border:0; outline:none; display:inline-block;">
{{#if hasLogoSizedHeight}}
              <img src="{{logoUrl}}" width="{{logoWidth}}" height="{{logoDisplayHeight}}" border="0" alt="" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:{{logoDisplayHeight}}px;border:0;outline:none;text-decoration:none;border-radius:{{logoImgBorderRadius}};" />
{{/if}}
{{#if hasLogoAutoHeight}}
              <img src="{{logoUrl}}" width="{{logoWidth}}" border="0" alt="" style="display:block;max-width:{{logoWidth}}px;width:{{logoWidth}}px;height:auto;border:0;outline:none;text-decoration:none;border-radius:{{logoImgBorderRadius}};" />
{{/if}}
            </a>
              </td>
            </tr></table>
            {{/if}}
            {{#if showAddressBlock}}
            <div style="margin-top: 8px; font-size: 11px; color: #5c6370; line-height: 1.35; letter-spacing: 0.2px;">
              {{addressBlockHtml}}
            </div>
            {{/if}}
          </td>

          <!-- Info column -->
          <td class="sig-corp-main-stack" style="vertical-align:top;padding-left:0;padding-right:6px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;">
              <tr>
                <td bgcolor="#f0f4ff" style="background-color:#f0f4ff;border-radius:10px;padding:10px 12px 8px 12px;">
            {{#if hasName}}
            <div style="font-size:18px; font-weight:700; color:{{primaryColor}}; letter-spacing:-0.2px;line-height:1.2;">
              {{firstName}} {{lastName}}
            </div>
            {{/if}}

            {{#if hasTitle}}
            <div style="font-size:11px; color:#5c6370; margin-top:2px; text-transform:uppercase; letter-spacing:0.6px; font-weight:600;line-height:1.3;">
              {{title}}
            </div>
            {{/if}}
                </td>
              </tr>
            </table>

            <div style="height:6px;line-height:6px;font-size:0;">&nbsp;</div>

            {{#if hasContact}}
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;"><tr>
              <td bgcolor="#f0f4ff" style="background-color:#f0f4ff;border-radius:10px;padding:10px 12px;">
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; font-size:12px;">
              {{#if hasOfficePhone}}
              <tr>
                <td colspan="2" valign="top" style="padding:0 0 4px 0;">
                  <a href="{{officePhoneTelHref}}" style="color:#444; text-decoration:none;">
                    {{officePhone}}
                  </a>
                </td>
              </tr>
              {{/if}}
              {{#if hasMobilePhone}}
              <tr>
                <td width="1%" valign="top" style="width:1%;white-space:nowrap;padding:0 6px 4px 0; color:{{primaryColor}}; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.3px;">Mobile</td>
                <td valign="top" style="padding:0 0 4px 0;">
                  <a href="{{mobilePhoneTelHref}}" style="color:#444; text-decoration:none;">
                    {{mobilePhone}}
                  </a>
                </td>
              </tr>
              {{/if}}
              <tr>
                <td colspan="2" valign="top" style="padding:0 0 4px 0;">
                  <a href="mailto:{{email}}" style="color:{{primaryColor}}; text-decoration:none; font-weight:600;">
                    {{email}}
                  </a>
                </td>
              </tr>
              {{#if hasWebsite}}
              <tr>
                <td colspan="2" valign="top" style="padding:0;">
                  <a href="{{website}}" style="color:#444; text-decoration:none;">
                    {{websiteDisplay}}
                  </a>
                </td>
              </tr>
              {{/if}}
            </table>
              </td>
            </tr></table>
            {{/if}}

            {{#if showSocialBlock}}
            <div style="height:6px;line-height:6px;font-size:0;">&nbsp;</div>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;"><tr>
              <td bgcolor="#f0f4ff" style="background-color:#f0f4ff;border-radius:10px;padding:8px 12px;">
            <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
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
            </tr></table>
              </td>
            </tr></table>
            {{/if}}
          </td>

          {{#if sideColumnContentBlocks}}
          <td class="sig-corp-blocks-stack sig-blocks-desktop" valign="top" style="vertical-align:top;padding:8px 8px 8px 10px;border-left:4px solid {{primaryColor}};background-color:#f0f4ff;width:54%;min-width:212px;">
            {{contentBlocksHtml}}
          </td>
          {{/if}}

        </tr>
      </table>
    </td>
  </tr>
  {{#if hasDivider}}
  <tr>
    <td colspan="3" style="padding:10px 10px 0 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td bgcolor="{{primaryColor}}" height="1" style="font-size:0;line-height:0;mso-line-height-rule:exactly;padding:0;height:1px;background-color:{{primaryColor}};border:0;opacity:0.35;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
  {{/if}}

  {{#if sideColumnContentBlocks}}
  <tr class="sig-blocks-stacked-row">
    <td colspan="3" style="padding:10px 10px 0 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;"><tr>
        <td bgcolor="#f0f4ff" style="background-color:#f0f4ff;border-radius:10px;padding:10px;">
          {{contentBlocksHtmlStacked}}
        </td>
      </tr></table>
    </td>
  </tr>
  {{/if}}

  <!-- Footer -->
  <tr>
    <td colspan="3" style="padding:8px 10px 10px 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation" style="border-collapse:collapse;width:100%;">
        <tr>
          <td bgcolor="#f3f4f6" style="font-size:11px;line-height:1.4;mso-line-height-rule:exactly;padding:10px 12px;background-color:#f3f4f6;border:0;border-radius:0 0 10px 10px;color:{{primaryColor}};font-family:{{fontFamily}}, Arial, Helvetica, sans-serif;font-weight:600;letter-spacing:0.3px;text-align:left;">
            {{companyName}}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
    </td>
  </tr>
</table>`;
