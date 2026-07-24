<?php
// Add custom Theme Functions here
add_filter('wt_cli_enable_ckyes_branding','__return_false',11);


// Alerte mail pour import IXON
function wt_pipe_cron_ended_DILIOS(){

    $email = 'contact@dilios.fr,audrey@abcm.io';
    wp_mail( $email, "STOCK IXON A JOUR", 'Tous les produits ont été mis à jour .' );

}

add_action('wt_pipe_cron_ended', 'wt_pipe_cron_ended_DILIOS');
